from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Notification, User, UserRole, UserStatus
from app.schemas import NotificationResponse, MessageResponse

router = APIRouter()


async def get_or_create_sql_user(mongo_user_id: str, mongo_user_data: dict, db: AsyncSession) -> int:
    """Get or create SQL user from MongoDB user data"""
    # Try to find existing user by email
    result = await db.execute(
        select(User).where(User.email == mongo_user_data.get("email"))
    )
    sql_user = result.scalar_one_or_none()
    
    if sql_user:
        return sql_user.id
    
    # Create new SQL user
    role_map = {
        "admin": UserRole.ADMIN,
        "super_admin": UserRole.SUPER_ADMIN,
        "faculty": UserRole.FACULTY,
        "student": UserRole.STUDENT
    }
    
    sql_user = User(
        email=mongo_user_data.get("email"),
        username=mongo_user_data.get("username", mongo_user_data.get("email")),
        full_name=mongo_user_data.get("full_name", ""),
        role=role_map.get(mongo_user_data.get("role"), UserRole.STUDENT),
        status=UserStatus.ACTIVE,
        is_verified=True
    )
    
    db.add(sql_user)
    await db.commit()
    await db.refresh(sql_user)
    
    return sql_user.id


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List notifications for current user"""
    mongo_user_id = current_user.get("sub")  # MongoDB ObjectId as string
    user_id = await get_or_create_sql_user(mongo_user_id, current_user, db)
    
    query = select(Notification).where(Notification.user_id == user_id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    query = query.order_by(desc(Notification.sent_at)).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return [NotificationResponse.model_validate(notif) for notif in notifications]


@router.put("/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark notification as read"""
    mongo_user_id = current_user.get("sub")  # MongoDB ObjectId as string
    user_id = await get_or_create_sql_user(mongo_user_id, current_user, db)
    
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()
    
    return MessageResponse(message="Notification marked as read")


@router.put("/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read"""
    mongo_user_id = current_user.get("sub")  # MongoDB ObjectId as string
    user_id = await get_or_create_sql_user(mongo_user_id, current_user, db)
    
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
    )
    notifications = result.scalars().all()
    
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
    
    await db.commit()
    
    return MessageResponse(message=f"{len(notifications)} notifications marked as read")
