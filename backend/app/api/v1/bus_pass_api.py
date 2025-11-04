from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
import qrcode
from io import BytesIO
import os
from pathlib import Path

# --- MongoDB Setup ---
client = MongoClient("mongodb://localhost:27017")
db = client["campus_portal"]
bus_pass_collection = db["bus_passes"]

# --- Upload Directory ---
UPLOAD_DIR = Path("uploads/bus_passes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- Pydantic Schemas ---
class BusPassCreate(BaseModel):
    user_id: str
    route: str
    boarding_point: str

class BusPassUpdate(BaseModel):
    route: Optional[str] = None
    boarding_point: Optional[str] = None
    status: Optional[str] = None

class BusPassOut(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    pass_id: str
    route: str
    boarding_point: str
    valid_from: str
    valid_to: str
    status: str
    qr_code_path: Optional[str] = None
    admin_comments: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# --- FastAPI Router ---
router = APIRouter(prefix="/bus-passes", tags=["Bus Passes"])

def generate_pass_id(user_id: str) -> str:
    """Generate unique bus pass ID"""
    year = datetime.now().year
    month = datetime.now().strftime("%m")
    count = bus_pass_collection.count_documents({"user_id": user_id}) + 1
    return f"BP-{year}{month}-{user_id[:8].upper()}-{count:03d}"

def generate_qr_code(pass_id: str, route: str, valid_from: str, valid_to: str) -> str:
    """Generate QR code for bus pass"""
    qr_data = f"Pass ID: {pass_id}\nRoute: {route}\nValid: {valid_from} to {valid_to}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code
    qr_filename = f"{pass_id}_qr.png"
    qr_path = UPLOAD_DIR / qr_filename
    img.save(qr_path)
    
    return str(qr_path)

@router.post("/", response_model=BusPassOut)
async def create_bus_pass(
    user_id: str = Form(...),
    route: str = Form(...),
    boarding_point: str = Form(...)
):
    """Create a new bus pass application"""
    # Generate pass ID
    pass_id = generate_pass_id(user_id)
    
    # Calculate validity dates
    valid_from = datetime.now()
    valid_to = valid_from + timedelta(days=30)  # 1 month validity
    
    # Create bus pass document
    doc = {
        "user_id": user_id,
        "pass_id": pass_id,
        "route": route,
        "boarding_point": boarding_point,
        "valid_from": valid_from.isoformat(),
        "valid_to": valid_to.isoformat(),
        "status": "pending",  # pending admin approval
        "qr_code_path": None,  # Generated after approval
        "admin_comments": None,
        "reviewed_at": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": None
    }
    
    result = bus_pass_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return BusPassOut(**doc)

@router.get("/", response_model=List[BusPassOut])
async def list_bus_passes(user_id: str):
    """Get all bus passes for a user"""
    docs = bus_pass_collection.find({"user_id": user_id}).sort("created_at", -1)
    return [BusPassOut(**{**doc, "_id": str(doc["_id"])}) for doc in docs]

@router.get("/admin/all", response_model=List[BusPassOut])
async def list_all_bus_passes(status: Optional[str] = None):
    """Admin: Get all bus passes, optionally filtered by status"""
    query = {}
    if status:
        query["status"] = status
    docs = bus_pass_collection.find(query).sort("created_at", -1)
    return [BusPassOut(**{**doc, "_id": str(doc["_id"])}) for doc in docs]

@router.get("/{pass_id}", response_model=BusPassOut)
async def get_bus_pass(pass_id: str):
    """Get a specific bus pass by ID"""
    if not ObjectId.is_valid(pass_id):
        raise HTTPException(status_code=400, detail="Invalid pass ID")
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Bus pass not found")
    
    doc["_id"] = str(doc["_id"])
    return BusPassOut(**doc)

@router.put("/admin/{pass_id}/review")
async def review_bus_pass(
    pass_id: str, 
    status: str = Form(...), 
    admin_comments: Optional[str] = Form(None)
):
    """Admin: Approve or reject a bus pass application"""
    if not ObjectId.is_valid(pass_id):
        raise HTTPException(status_code=400, detail="Invalid pass ID")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Bus pass not found")
    
    update_data = {
        "status": "active" if status == "approved" else "rejected",
        "admin_comments": admin_comments,
        "reviewed_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Generate QR code if approved
    if status == "approved":
        qr_path = generate_qr_code(
            doc["pass_id"],
            doc["route"],
            doc["valid_from"],
            doc["valid_to"]
        )
        update_data["qr_code_path"] = qr_path
    
    bus_pass_collection.update_one(
        {"_id": ObjectId(pass_id)},
        {"$set": update_data}
    )
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    doc["_id"] = str(doc["_id"])
    return BusPassOut(**doc)

@router.get("/{pass_id}/qr-code")
async def download_qr_code(pass_id: str):
    """Download the bus pass QR code"""
    if not ObjectId.is_valid(pass_id):
        raise HTTPException(status_code=400, detail="Invalid pass ID")
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Bus pass not found")
    
    if not doc.get("qr_code_path"):
        raise HTTPException(status_code=404, detail="QR code not available. Pass must be approved first.")
    
    qr_path = Path(doc["qr_code_path"])
    if not qr_path.exists():
        raise HTTPException(status_code=404, detail="QR code file not found")
    
    return FileResponse(
        path=qr_path,
        filename=f"{doc['pass_id']}_qr.png",
        media_type="image/png"
    )

@router.get("/{pass_id}/download")
async def download_bus_pass(pass_id: str):
    """Download the bus pass as PDF (placeholder - can be enhanced with PDF generation)"""
    if not ObjectId.is_valid(pass_id):
        raise HTTPException(status_code=400, detail="Invalid pass ID")
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Bus pass not found")
    
    if doc["status"] != "active":
        raise HTTPException(status_code=400, detail="Pass must be approved before download")
    
    # For now, return the QR code. Can be enhanced to generate full PDF with pass details
    if not doc.get("qr_code_path"):
        raise HTTPException(status_code=404, detail="QR code not available")
    
    qr_path = Path(doc["qr_code_path"])
    if not qr_path.exists():
        raise HTTPException(status_code=404, detail="QR code file not found")
    
    return FileResponse(
        path=qr_path,
        filename=f"{doc['pass_id']}_pass.png",
        media_type="image/png"
    )

@router.put("/{pass_id}", response_model=BusPassOut)
async def update_bus_pass(pass_id: str, bus_pass: BusPassUpdate):
    """Update a bus pass"""
    if not ObjectId.is_valid(pass_id):
        raise HTTPException(status_code=400, detail="Invalid pass ID")
    
    update_data = {k: v for k, v in bus_pass.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now().isoformat()
    
    result = bus_pass_collection.update_one(
        {"_id": ObjectId(pass_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bus pass not found")
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    doc["_id"] = str(doc["_id"])
    return BusPassOut(**doc)

@router.delete("/{pass_id}")
async def delete_bus_pass(pass_id: str):
    """Delete a bus pass"""
    if not ObjectId.is_valid(pass_id):
        raise HTTPException(status_code=400, detail="Invalid pass ID")
    
    doc = bus_pass_collection.find_one({"_id": ObjectId(pass_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Bus pass not found")
    
    # Delete QR code file if exists
    if doc.get("qr_code_path"):
        qr_path = Path(doc["qr_code_path"])
        if qr_path.exists():
            qr_path.unlink()
    
    bus_pass_collection.delete_one({"_id": ObjectId(pass_id)})
    
    return {"detail": "Bus pass deleted successfully"}
