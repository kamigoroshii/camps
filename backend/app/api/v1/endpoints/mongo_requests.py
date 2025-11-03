from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
from bson import ObjectId

from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()


def generate_request_number() -> str:
    """Generate unique request number"""
    timestamp = datetime.now().strftime("%Y%m%d")
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"REQ-{timestamp}-{unique_id}"


# Mock data for now - replace with MongoDB queries later
MOCK_REQUESTS = [
    {
        "id": 1,
        "request_number": "REQ-20241103-A1B2C3D4",
        "title": "Bus Pass Request",
        "description": "Need a monthly bus pass for transportation",
        "status": "submitted",
        "request_type": "bus_pass",
        "priority": "normal",
        "created_at": "2024-11-01T10:00:00Z",
        "updated_at": "2024-11-01T10:00:00Z",
        "sla_due_date": "2024-11-03T10:00:00Z"
    },
    {
        "id": 2,
        "request_number": "REQ-20241102-E5F6G7H8",
        "title": "Certificate Request",
        "description": "Request for graduation certificate",
        "status": "in_progress",
        "request_type": "certificate",
        "priority": "urgent",
        "created_at": "2024-11-02T14:30:00Z",
        "updated_at": "2024-11-02T16:00:00Z",
        "sla_due_date": "2024-11-03T14:30:00Z"
    },
    {
        "id": 3,
        "request_number": "REQ-20241101-I9J0K1L2",
        "title": "Scholarship Application",
        "description": "Application for merit-based scholarship",
        "status": "completed",
        "request_type": "scholarship",
        "priority": "normal",
        "created_at": "2024-10-30T09:15:00Z",
        "updated_at": "2024-11-01T12:00:00Z",
        "sla_due_date": "2024-11-01T09:15:00Z",
        "completed_at": "2024-11-01T12:00:00Z"
    },
    {
        "id": 4,
        "request_number": "REQ-20241103-M3N4O5P6",
        "title": "Library Book Request",
        "description": "Request for rare book access",
        "status": "submitted",
        "request_type": "library",
        "priority": "low",
        "created_at": "2024-11-03T08:00:00Z",
        "updated_at": "2024-11-03T08:00:00Z",
        "sla_due_date": "2024-11-05T08:00:00Z"
    }
]


@router.get("", response_model=dict)
async def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = None,
    request_type: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    current_user: dict = Depends(get_current_user)
):
    """List service requests with pagination and filters"""
    
    user_id = current_user.get("sub")
    user_role = current_user.get("role", "student")
    
    # Filter requests based on user role
    requests = MOCK_REQUESTS.copy()
    
    # Apply filters
    if status_filter:
        requests = [req for req in requests if req["status"] == status_filter]
    if request_type:
        requests = [req for req in requests if req["request_type"] == request_type]
    if priority:
        requests = [req for req in requests if req["priority"] == priority]
    if search:
        requests = [
            req for req in requests
            if search.lower() in req["title"].lower() or 
               search.lower() in req["request_number"].lower()
        ]
    
    # Sort
    reverse = order == "desc"
    if sort == "created_at":
        requests.sort(key=lambda x: x["created_at"], reverse=reverse)
    elif sort == "updated_at":
        requests.sort(key=lambda x: x["updated_at"], reverse=reverse)
    
    # Pagination
    total = len(requests)
    start = (page - 1) * page_size
    end = start + page_size
    requests = requests[start:end]
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "requests": requests
    }


@router.get("/{request_id}", response_model=dict)
async def get_request(
    request_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific service request"""
    
    user_id = current_user.get("sub")
    user_role = current_user.get("role", "student")
    
    # Find request
    request = next((req for req in MOCK_REQUESTS if req["id"] == request_id), None)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    return request


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new service request"""
    
    user_id = current_user.get("sub")
    
    # Calculate SLA due date
    sla_hours = 24 if request_data.get("priority") == "urgent" else 48
    sla_due_date = datetime.utcnow() + timedelta(hours=sla_hours)
    
    # Create new request
    new_request = {
        "id": len(MOCK_REQUESTS) + 1,
        "request_number": generate_request_number(),
        "title": request_data.get("title"),
        "description": request_data.get("description"),
        "status": "submitted",
        "request_type": request_data.get("request_type"),
        "priority": request_data.get("priority", "normal"),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "sla_due_date": sla_due_date.isoformat() + "Z",
        "user_id": user_id
    }
    
    MOCK_REQUESTS.append(new_request)
    
    return new_request


@router.put("/{request_id}", response_model=dict)
async def update_request(
    request_id: int,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a service request"""
    
    user_id = current_user.get("sub")
    user_role = current_user.get("role", "student")
    
    # Find request
    request = next((req for req in MOCK_REQUESTS if req["id"] == request_id), None)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Update fields
    for field, value in update_data.items():
        if field != "id":
            request[field] = value
    
    request["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return request


@router.delete("/{request_id}", response_model=dict)
async def cancel_request(
    request_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a service request"""
    
    user_id = current_user.get("sub")
    
    # Find request
    request = next((req for req in MOCK_REQUESTS if req["id"] == request_id), None)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    if request["status"] in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel request in {request['status']} status"
        )
    
    request["status"] = "cancelled"
    request["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return {"message": "Request cancelled successfully"}