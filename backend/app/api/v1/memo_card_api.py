from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
import os
import shutil
from pathlib import Path

# --- MongoDB Setup ---
client = MongoClient("mongodb://localhost:27017")
db = client["campus_portal"]
memo_collection = db["memo_cards"]

# --- Upload Directory ---
UPLOAD_DIR = Path("uploads/memo_cards")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- Pydantic Schemas ---
class MemoCardCreate(BaseModel):
    user_id: str
    semester: str
    academic_year: str
    status: str = "active"

class MemoCardUpdate(BaseModel):
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    status: Optional[str] = None

class MemoCardOut(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    memo_id: str
    semester: str
    academic_year: str
    issue_date: str
    expiry_date: str
    status: str
    document_path: Optional[str] = None
    admin_comments: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# --- FastAPI Router ---
# Note: main.py includes this router with prefix "/api/v1".
# To avoid double prefixing, keep this router scoped to "/memo-cards" only.
router = APIRouter(prefix="/memo-cards", tags=["Memo Cards"])

def generate_memo_id(user_id: str) -> str:
    """Generate unique memo ID"""
    year = datetime.now().year
    count = memo_collection.count_documents({"user_id": user_id}) + 1
    return f"MC-{year}-{user_id[:8].upper()}-{count:03d}"

@router.post("/", response_model=MemoCardOut)
async def create_memo_card(
    user_id: str = Form(...),
    semester: str = Form(...),
    academic_year: str = Form(...),
    document: Optional[UploadFile] = File(None)
):
    """Create a new memo card with optional document upload"""
    # Generate memo ID
    memo_id = generate_memo_id(user_id)
    
    # Calculate dates
    issue_date = datetime.now()
    expiry_date = issue_date + timedelta(days=180)  # 6 months validity
    
    # Handle document upload
    document_path = None
    if document:
        file_ext = os.path.splitext(document.filename)[1]
        filename = f"{memo_id}{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(document.file, buffer)
        
        document_path = str(file_path)
    
    # Create memo card document
    doc = {
        "user_id": user_id,
        "memo_id": memo_id,
        "semester": semester,
        "academic_year": academic_year,
        "issue_date": issue_date.isoformat(),
        "expiry_date": expiry_date.isoformat(),
        # track request status for user visibility
        "status": "submitted",
        "document_path": document_path,
        "created_at": datetime.now().isoformat(),
        "updated_at": None
    }
    
    result = memo_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return MemoCardOut(**doc)

@router.get("/", response_model=List[MemoCardOut])
async def list_memo_cards(user_id: str):
    """Get all memo cards for a user"""
    docs = memo_collection.find({"user_id": user_id}).sort("created_at", -1)
    return [MemoCardOut(**{**doc, "_id": str(doc["_id"])}) for doc in docs]

@router.get("/admin/all", response_model=List[MemoCardOut])
async def list_all_memo_cards(status: Optional[str] = None):
    """Admin: Get all memo cards, optionally filtered by status"""
    query = {}
    if status:
        query["status"] = status
    docs = memo_collection.find(query).sort("created_at", -1)
    return [MemoCardOut(**{**doc, "_id": str(doc["_id"])}) for doc in docs]

@router.put("/admin/{memo_id}/review")
async def review_memo_card(memo_id: str, status: str = Form(...), admin_comments: Optional[str] = Form(None)):
    """Admin: Approve or reject a memo card request"""
    if not ObjectId.is_valid(memo_id):
        raise HTTPException(status_code=400, detail="Invalid memo card ID")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    update_data = {
        "status": status,
        "admin_comments": admin_comments,
        "reviewed_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # If approved, set as active
    if status == "approved":
        update_data["status"] = "active"
    
    result = memo_collection.update_one(
        {"_id": ObjectId(memo_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    doc["_id"] = str(doc["_id"])
    return MemoCardOut(**doc)

@router.get("/{memo_id}", response_model=MemoCardOut)
async def get_memo_card(memo_id: str):
    """Get a specific memo card by ID"""
    if not ObjectId.is_valid(memo_id):
        raise HTTPException(status_code=400, detail="Invalid memo card ID")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    doc["_id"] = str(doc["_id"])
    return MemoCardOut(**doc)

@router.get("/{memo_id}/download")
async def download_memo_document(memo_id: str):
    """Download the memo card document"""
    if not ObjectId.is_valid(memo_id):
        raise HTTPException(status_code=400, detail="Invalid memo card ID")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    if not doc.get("document_path"):
        raise HTTPException(status_code=404, detail="No document attached to this memo card")
    
    file_path = Path(doc["document_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document file not found")
    
    return FileResponse(
        path=file_path,
        filename=f"{doc['memo_id']}{file_path.suffix}",
        media_type="application/octet-stream"
    )

@router.put("/{memo_id}", response_model=MemoCardOut)
async def update_memo_card(memo_id: str, memo: MemoCardUpdate):
    """Update a memo card"""
    if not ObjectId.is_valid(memo_id):
        raise HTTPException(status_code=400, detail="Invalid memo card ID")
    
    update_data = {k: v for k, v in memo.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now().isoformat()
    
    result = memo_collection.update_one(
        {"_id": ObjectId(memo_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    doc["_id"] = str(doc["_id"])
    return MemoCardOut(**doc)

@router.delete("/{memo_id}")
async def delete_memo_card(memo_id: str):
    """Delete a memo card and its document"""
    if not ObjectId.is_valid(memo_id):
        raise HTTPException(status_code=400, detail="Invalid memo card ID")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    # Delete document file if exists
    if doc.get("document_path"):
        file_path = Path(doc["document_path"])
        if file_path.exists():
            file_path.unlink()
    
    result = memo_collection.delete_one({"_id": ObjectId(memo_id)})
    
    return {"detail": "Memo card deleted successfully"}

@router.post("/{memo_id}/upload")
async def upload_memo_document(memo_id: str, document: UploadFile = File(...)):
    """Upload or replace document for an existing memo card"""
    if not ObjectId.is_valid(memo_id):
        raise HTTPException(status_code=400, detail="Invalid memo card ID")
    
    doc = memo_collection.find_one({"_id": ObjectId(memo_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Memo card not found")
    
    # Delete old document if exists
    if doc.get("document_path"):
        old_path = Path(doc["document_path"])
        if old_path.exists():
            old_path.unlink()
    
    # Save new document
    file_ext = os.path.splitext(document.filename)[1]
    filename = f"{doc['memo_id']}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(document.file, buffer)
    
    # Update database
    memo_collection.update_one(
        {"_id": ObjectId(memo_id)},
        {"$set": {
            "document_path": str(file_path),
            "updated_at": datetime.now().isoformat()
        }}
    )
    
    return {"detail": "Document uploaded successfully", "filename": filename}
