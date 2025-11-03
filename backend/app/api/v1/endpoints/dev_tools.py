from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import ServiceRequest, RequestType, RequestStatus, Priority, User, UserRole, UserStatus, Notification
from datetime import datetime, timedelta
import uuid

router = APIRouter()


@router.post("/seed-data")
async def seed_initial_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Seed initial data for testing"""
    
    # Get or create SQL user
    from app.api.v1.endpoints.requests import get_or_create_sql_user
    user_id = await get_or_create_sql_user(current_user.get("sub"), current_user, db)
    
    # Create sample service requests
    sample_requests = [
        {
            "request_number": f"REQ-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "user_id": user_id,
            "request_type": RequestType.BONAFIDE_CERTIFICATE,
            "title": "Bonafide Certificate Request",
            "description": "Need bonafide certificate for bank loan application",
            "priority": Priority.HIGH,
            "status": RequestStatus.SUBMITTED,
            "sla_due_date": datetime.utcnow() + timedelta(hours=48)
        },
        {
            "request_number": f"REQ-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "user_id": user_id,
            "request_type": RequestType.TRANSCRIPT_REQUEST,
            "title": "Official Transcript Request",
            "description": "Need official transcript for job application",
            "priority": Priority.MEDIUM,
            "status": RequestStatus.UNDER_REVIEW,
            "sla_due_date": datetime.utcnow() + timedelta(hours=72)
        },
        {
            "request_number": f"REQ-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "user_id": user_id,
            "request_type": RequestType.SCHOLARSHIP_APPLICATION,
            "title": "Merit Scholarship Application",
            "description": "Application for merit-based scholarship for next semester",
            "priority": Priority.LOW,
            "status": RequestStatus.COMPLETED,
            "sla_due_date": datetime.utcnow() + timedelta(hours=168),
            "completed_at": datetime.utcnow() - timedelta(hours=24)
        },
        {
            "request_number": f"REQ-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "user_id": user_id,
            "request_type": RequestType.ID_CARD_REQUEST,
            "title": "Student ID Card Replacement",
            "description": "Lost student ID card, need replacement",
            "priority": Priority.URGENT,
            "status": RequestStatus.APPROVED,
            "sla_due_date": datetime.utcnow() + timedelta(hours=24)
        }
    ]
    
    created_requests = []
    for req_data in sample_requests:
        request = ServiceRequest(**req_data)
        db.add(request)
        created_requests.append(request)
    
    # Create sample notifications
    sample_notifications = [
        {
            "user_id": user_id,
            "title": "Request Status Update",
            "message": "Your bonafide certificate request has been submitted successfully",
            "notification_type": "request_update",
            "is_read": False
        },
        {
            "user_id": user_id,
            "title": "Document Required",
            "message": "Please upload your identity proof for transcript request",
            "notification_type": "document_required",
            "is_read": False
        },
        {
            "user_id": user_id,
            "title": "Request Approved",
            "message": "Your ID card replacement request has been approved",
            "notification_type": "request_approved",
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "user_id": user_id,
            "title": "SLA Alert",
            "message": "Your transcript request is approaching deadline",
            "notification_type": "sla_alert",
            "is_read": False
        }
    ]
    
    created_notifications = []
    for notif_data in sample_notifications:
        notification = Notification(**notif_data)
        db.add(notification)
        created_notifications.append(notification)
    
    await db.commit()
    
    return {
        "message": "Sample data created successfully",
        "requests_created": len(created_requests),
        "notifications_created": len(created_notifications),
        "user_id": user_id
    }