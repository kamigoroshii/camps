from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import ServiceRequest, RequestStatus, RequestType, User
from app.schemas import DashboardStats, RequestTypeStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics for admins"""
    
    # Total requests
    total_result = await db.execute(select(func.count(ServiceRequest.id)))
    total_requests = total_result.scalar()
    
    # Status counts
    pending_result = await db.execute(
        select(func.count(ServiceRequest.id)).where(
            ServiceRequest.status.in_([
                RequestStatus.SUBMITTED,
                RequestStatus.UNDER_REVIEW,
                RequestStatus.PENDING_APPROVAL
            ])
        )
    )
    pending_requests = pending_result.scalar()
    
    approved_result = await db.execute(
        select(func.count(ServiceRequest.id)).where(
            ServiceRequest.status == RequestStatus.APPROVED
        )
    )
    approved_requests = approved_result.scalar()
    
    rejected_result = await db.execute(
        select(func.count(ServiceRequest.id)).where(
            ServiceRequest.status == RequestStatus.REJECTED
        )
    )
    rejected_requests = rejected_result.scalar()
    
    completed_result = await db.execute(
        select(func.count(ServiceRequest.id)).where(
            ServiceRequest.status == RequestStatus.COMPLETED
        )
    )
    completed_requests = completed_result.scalar()
    
    # Average processing time (for completed requests)
    avg_time_result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', ServiceRequest.completed_at - ServiceRequest.created_at) / 3600
            )
        ).where(
            and_(
                ServiceRequest.status == RequestStatus.COMPLETED,
                ServiceRequest.completed_at.isnot(None)
            )
        )
    )
    avg_processing_time = avg_time_result.scalar() or 0.0
    
    # SLA compliance rate
    sla_compliance_result = await db.execute(
        select(
            func.count(
                case(
                    (ServiceRequest.completed_at <= ServiceRequest.sla_due_date, 1),
                    else_=None
                )
            ).label('compliant'),
            func.count(ServiceRequest.id).label('total')
        ).where(
            and_(
                ServiceRequest.status == RequestStatus.COMPLETED,
                ServiceRequest.completed_at.isnot(None)
            )
        )
    )
    sla_data = sla_compliance_result.one()
    sla_compliance_rate = (sla_data.compliant / sla_data.total * 100) if sla_data.total > 0 else 100.0
    
    return DashboardStats(
        total_requests=total_requests,
        pending_requests=pending_requests,
        approved_requests=approved_requests,
        rejected_requests=rejected_requests,
        completed_requests=completed_requests,
        avg_processing_time=round(avg_processing_time, 2),
        sla_compliance_rate=round(sla_compliance_rate, 2)
    )


@router.get("/request-type-stats", response_model=list[RequestTypeStats])
async def get_request_type_stats(
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics by request type"""
    
    result = await db.execute(
        select(
            ServiceRequest.request_type,
            func.count(ServiceRequest.id).label('count'),
            func.avg(
                func.extract('epoch', ServiceRequest.completed_at - ServiceRequest.created_at) / 3600
            ).label('avg_time')
        ).where(
            ServiceRequest.status == RequestStatus.COMPLETED
        ).group_by(
            ServiceRequest.request_type
        )
    )
    
    stats = []
    for row in result:
        stats.append(RequestTypeStats(
            request_type=row.request_type.value,
            count=row.count,
            avg_processing_time=round(row.avg_time or 0, 2)
        ))
    
    return stats
