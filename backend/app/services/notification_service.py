"""
Notification service for sending notifications to users
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Notification, ServiceRequest

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling user notifications"""
    
    def __init__(self):
        pass
    
    async def send_scholarship_status_notification(
        self,
        db: AsyncSession,
        user_id: int,
        request: ServiceRequest,
        status_change: str,
        additional_info: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send notification for scholarship application status changes
        """
        try:
            # Create notification messages based on status
            notification_messages = {
                "submitted": {
                    "title": "Scholarship Application Submitted",
                    "message": f"Your scholarship application ({request.request_number}) has been submitted successfully. You can now upload required documents for verification."
                },
                "under_review": {
                    "title": "Application Under Review", 
                    "message": f"Your scholarship application ({request.request_number}) is now under review by our team."
                },
                "approved": {
                    "title": "🎉 Scholarship Application Approved!",
                    "message": f"Congratulations! Your scholarship application ({request.request_number}) has been approved. You will receive further instructions via email."
                },
                "rejected": {
                    "title": "Scholarship Application Update",
                    "message": f"Your scholarship application ({request.request_number}) requires revision. Please check the details and resubmit if needed."
                },
                "pending_approval": {
                    "title": "Additional Information Required",
                    "message": f"Your scholarship application ({request.request_number}) requires additional information. Please review and provide the requested details."
                },
                "document_uploaded": {
                    "title": "Document Uploaded Successfully",
                    "message": f"Document uploaded for application ({request.request_number}) and verification is in progress."
                }
            }
            
            if status_change not in notification_messages:
                logger.warning(f"Unknown status change: {status_change}")
                return False
            
            notification_data = notification_messages[status_change]
            
            # Add additional context if provided
            if additional_info:
                if additional_info.get('admin_comments'):
                    notification_data["message"] += f"\n\nAdmin Comments: {additional_info['admin_comments']}"
                if additional_info.get('document_name'):
                    notification_data["message"] = notification_data["message"].replace(
                        "Document uploaded", 
                        f"Document '{additional_info['document_name']}' uploaded"
                    )
            
            # Create notification record
            notification = Notification(
                user_id=user_id,
                title=notification_data["title"],
                message=notification_data["message"],
                notification_type="in_app",
                request_id=request.id
            )
            
            db.add(notification)
            await db.commit()
            
            logger.info(f"Notification sent to user {user_id} for status change: {status_change}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return False
    
    async def send_admin_notification(
        self,
        db: AsyncSession,
        admin_user_id: int,
        request: ServiceRequest,
        notification_type: str,
        additional_info: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send notification to admin users
        """
        try:
            admin_messages = {
                "new_application": {
                    "title": "New Scholarship Application",
                    "message": f"New scholarship application submitted: {request.request_number}. Review required."
                },
                "verification_complete": {
                    "title": "Document Verification Complete",
                    "message": f"Automated verification completed for application: {request.request_number}. Manual review may be required."
                },
                "high_confidence_approval": {
                    "title": "High Confidence Application",
                    "message": f"Application {request.request_number} has high verification confidence and may be auto-approved."
                }
            }
            
            if notification_type not in admin_messages:
                logger.warning(f"Unknown admin notification type: {notification_type}")
                return False
            
            notification_data = admin_messages[notification_type]
            
            # Create notification record
            notification = Notification(
                user_id=admin_user_id,
                title=notification_data["title"],
                message=notification_data["message"],
                notification_type="in_app",
                request_id=request.id
            )
            
            db.add(notification)
            await db.commit()
            
            logger.info(f"Admin notification sent to user {admin_user_id} for type: {notification_type}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending admin notification: {e}")
            return False
    
    async def get_user_notifications(
        self,
        db: AsyncSession,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> list:
        """
        Get notifications for a user
        """
        try:
            from sqlalchemy import select
            
            stmt = select(Notification).where(Notification.user_id == user_id)
            
            if unread_only:
                stmt = stmt.where(Notification.is_read == False)
            
            stmt = stmt.order_by(Notification.sent_at.desc()).limit(limit)
            
            result = await db.execute(stmt)
            notifications = result.scalars().all()
            
            return [
                {
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "type": notif.notification_type,
                    "is_read": notif.is_read,
                    "request_id": notif.request_id,
                    "sent_at": notif.sent_at.isoformat(),
                    "read_at": notif.read_at.isoformat() if notif.read_at else None
                }
                for notif in notifications
            ]
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []
    
    async def mark_notification_read(
        self,
        db: AsyncSession,
        notification_id: int,
        user_id: int
    ) -> bool:
        """
        Mark a notification as read
        """
        try:
            notification = await db.get(Notification, notification_id)
            
            if not notification or notification.user_id != user_id:
                return False
            
            notification.is_read = True
            if not notification.read_at:
                from datetime import datetime
                notification.read_at = datetime.now()
            
            await db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False


# Global notification service instance
notification_service = NotificationService()