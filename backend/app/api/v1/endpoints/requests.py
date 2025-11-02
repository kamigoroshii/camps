from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models import (
    ServiceRequest,
    RequestStatus,
    RequestType,
    Priority,
    User,
    WorkflowLog,
    AuditLog
)
from app.schemas import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestResponse,
    ServiceRequestListResponse,
    WorkflowAction,
    WorkflowLogResponse,
    MessageResponse
)

router = APIRouter()


def generate_request_number() -> str:
    """Generate unique request number"""
    timestamp = datetime.now().strftime("%Y%m%d")
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"REQ-{timestamp}-{unique_id}"


@router.post("", response_model=ServiceRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: ServiceRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new service request"""
    
    user_id = int(current_user.get("sub"))
    
    # Calculate SLA due date
    sla_hours = settings.URGENT_SLA_HOURS if request_data.priority == Priority.URGENT else settings.DEFAULT_SLA_HOURS
    sla_due_date = datetime.utcnow() + timedelta(hours=sla_hours)
    
    # Create request
    new_request = ServiceRequest(
        request_number=generate_request_number(),
        user_id=user_id,
        request_type=request_data.request_type,
        title=request_data.title,
        description=request_data.description,
        priority=request_data.priority,
        request_data=request_data.request_data,
        status=RequestStatus.SUBMITTED,
        sla_due_date=sla_due_date
    )
    
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    
    # Create workflow log
    workflow_log = WorkflowLog(
        request_id=new_request.id,
        from_status=None,
        to_status=RequestStatus.SUBMITTED.value,
        action="REQUEST_CREATED",
        performed_by=user_id,
        comments="Request created"
    )
    db.add(workflow_log)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user_id,
        action="REQUEST_CREATED",
        entity_type="ServiceRequest",
        entity_id=new_request.id,
        new_values={"request_number": new_request.request_number}
    )
    db.add(audit_log)
    
    await db.commit()
    
    return new_request


@router.get("", response_model=ServiceRequestListResponse)
async def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[RequestStatus] = None,
    request_type: Optional[RequestType] = None,
    priority: Optional[Priority] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List service requests with pagination and filters"""
    
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    # Build query based on role
    query = select(ServiceRequest)
    
    if user_role == "student":
        # Students see only their requests
        query = query.where(ServiceRequest.user_id == user_id)
    elif user_role == "faculty":
        # Faculty see their own and assigned requests
        query = query.where(
            or_(
                ServiceRequest.user_id == user_id,
                ServiceRequest.assigned_to == user_id
            )
        )
    # Admins and super_admins see all requests
    
    # Apply filters
    if status_filter:
        query = query.where(ServiceRequest.status == status_filter)
    if request_type:
        query = query.where(ServiceRequest.request_type == request_type)
    if priority:
        query = query.where(ServiceRequest.priority == priority)
    if search:
        query = query.where(
            or_(
                ServiceRequest.title.ilike(f"%{search}%"),
                ServiceRequest.request_number.ilike(f"%{search}%")
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(desc(ServiceRequest.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    return ServiceRequestListResponse(
        total=total,
        page=page,
        page_size=page_size,
        requests=[ServiceRequestResponse.model_validate(req) for req in requests]
    )


@router.get("/{request_id}", response_model=ServiceRequestResponse)
async def get_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific service request"""
    
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Check access permissions
    if user_role == "student" and request.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    elif user_role == "faculty" and request.user_id != user_id and request.assigned_to != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return request


@router.put("/{request_id}", response_model=ServiceRequestResponse)
async def update_request(
    request_id: int,
    update_data: ServiceRequestUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a service request"""
    
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Only owner can update their request if it's in draft or submitted status
    if request.user_id == user_id:
        if request.status not in [RequestStatus.DRAFT, RequestStatus.SUBMITTED]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update request in current status"
            )
    elif user_role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    old_values = {}
    new_values = {}
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if value is not None:
            old_values[field] = getattr(request, field)
            setattr(request, field, value)
            new_values[field] = value
    
    await db.commit()
    await db.refresh(request)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user_id,
        action="REQUEST_UPDATED",
        entity_type="ServiceRequest",
        entity_id=request.id,
        old_values=old_values,
        new_values=new_values
    )
    db.add(audit_log)
    await db.commit()
    
    return request


@router.post("/{request_id}/workflow", response_model=MessageResponse)
async def execute_workflow_action(
    request_id: int,
    workflow_action: WorkflowAction,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Execute workflow action (approve, reject, complete, etc.)"""
    
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    # Only admin and faculty can execute workflow actions
    if user_role not in ["admin", "super_admin", "faculty"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Update request status
    old_status = request.status
    request.status = workflow_action.to_status
    
    if workflow_action.to_status == RequestStatus.COMPLETED:
        request.completed_at = datetime.utcnow()
    
    # Create workflow log
    workflow_log = WorkflowLog(
        request_id=request.id,
        from_status=old_status.value,
        to_status=workflow_action.to_status.value,
        action=workflow_action.action,
        performed_by=user_id,
        comments=workflow_action.comments,
        metadata=workflow_action.metadata
    )
    db.add(workflow_log)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user_id,
        action=f"WORKFLOW_{workflow_action.action}",
        entity_type="ServiceRequest",
        entity_id=request.id,
        old_values={"status": old_status.value},
        new_values={"status": workflow_action.to_status.value}
    )
    db.add(audit_log)
    
    await db.commit()
    
    return MessageResponse(
        message="Workflow action executed successfully",
        detail=f"Request status changed from {old_status.value} to {workflow_action.to_status.value}"
    )


@router.get("/{request_id}/workflow-history", response_model=List[WorkflowLogResponse])
async def get_workflow_history(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflow history for a request"""
    
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    # Check if request exists and user has access
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    if user_role == "student" and request.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get workflow logs
    result = await db.execute(
        select(WorkflowLog)
        .where(WorkflowLog.request_id == request_id)
        .order_by(desc(WorkflowLog.created_at))
    )
    logs = result.scalars().all()
    
    return [WorkflowLogResponse.model_validate(log) for log in logs]


@router.delete("/{request_id}", response_model=MessageResponse)
async def cancel_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a service request"""
    
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Only owner or admin can cancel
    if request.user_id != user_id and user_role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Cannot cancel completed or already cancelled requests
    if request.status in [RequestStatus.COMPLETED, RequestStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel request in {request.status.value} status"
        )
    
    old_status = request.status
    request.status = RequestStatus.CANCELLED
    
    # Create workflow log
    workflow_log = WorkflowLog(
        request_id=request.id,
        from_status=old_status.value,
        to_status=RequestStatus.CANCELLED.value,
        action="REQUEST_CANCELLED",
        performed_by=user_id
    )
    db.add(workflow_log)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user_id,
        action="REQUEST_CANCELLED",
        entity_type="ServiceRequest",
        entity_id=request.id
    )
    db.add(audit_log)
    
    await db.commit()
    
    return MessageResponse(message="Request cancelled successfully")
