from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from datetime import datetime

from app.core.security import get_current_user

router = APIRouter()

# Mock notifications data
MOCK_NOTIFICATIONS = [
    {
        "id": 1,
        "title": "Request Status Update",
        "message": "Your bus pass request has been approved",
        "type": "request_update",
        "is_read": False,
        "sent_at": "2024-11-03T08:00:00Z",
        "user_id": "6907fd2e77f984d6b42f1040"
    },
    {
        "id": 2,
        "title": "Certificate Ready",
        "message": "Your graduation certificate is ready for pickup",
        "type": "certificate",
        "is_read": False,
        "sent_at": "2024-11-02T15:30:00Z",
        "user_id": "6907fd2e77f984d6b42f1040"
    },
    {
        "id": 3,
        "title": "Scholarship Application Received",
        "message": "We have received your scholarship application",
        "type": "scholarship",
        "is_read": True,
        "sent_at": "2024-11-01T09:00:00Z",
        "read_at": "2024-11-01T14:00:00Z",
        "user_id": "6907fd2e77f984d6b42f1040"
    },
    {
        "id": 4,
        "title": "SLA Alert",
        "message": "Your certificate request is approaching SLA deadline",
        "type": "sla_alert",
        "is_read": False,
        "sent_at": "2024-11-03T07:00:00Z",
        "user_id": "6907fd2e77f984d6b42f1040"
    },
    {
        "id": 5,
        "title": "System Maintenance",
        "message": "Scheduled maintenance on Nov 5, 2024 from 2-4 AM",
        "type": "system",
        "is_read": False,
        "sent_at": "2024-11-02T18:00:00Z",
        "user_id": "6907fd2e77f984d6b42f1040"
    }
]


@router.get("", response_model=List[dict])
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List notifications for current user"""
    user_id = current_user.get("sub")
    
    # Filter notifications for current user
    notifications = [
        notif for notif in MOCK_NOTIFICATIONS 
        if notif.get("user_id") == user_id
    ]
    
    if unread_only:
        notifications = [notif for notif in notifications if not notif["is_read"]]
    
    # Sort by sent_at descending
    notifications.sort(key=lambda x: x["sent_at"], reverse=True)
    
    # Apply limit
    notifications = notifications[:limit]
    
    return notifications


@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    user_id = current_user.get("sub")
    
    # Find notification
    notification = next(
        (notif for notif in MOCK_NOTIFICATIONS 
         if notif["id"] == notification_id and notif.get("user_id") == user_id),
        None
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification["is_read"] = True
    notification["read_at"] = datetime.utcnow().isoformat() + "Z"
    
    return {"message": "Notification marked as read"}


@router.put("/read-all", response_model=dict)
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    user_id = current_user.get("sub")
    
    # Mark all user's notifications as read
    count = 0
    for notification in MOCK_NOTIFICATIONS:
        if notification.get("user_id") == user_id and not notification["is_read"]:
            notification["is_read"] = True
            notification["read_at"] = datetime.utcnow().isoformat() + "Z"
            count += 1
    
    return {"message": f"{count} notifications marked as read"}


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread notifications"""
    user_id = current_user.get("sub")
    
    count = sum(
        1 for notif in MOCK_NOTIFICATIONS
        if notif.get("user_id") == user_id and not notif["is_read"]
    )
    
    return {"unread_count": count}