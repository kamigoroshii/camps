from fastapi import APIRouter, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from app.core.database import get_db
from app.models import (
    ServiceRequest,
    RequestStatus,
    RequestType,
    Priority,
    User,
    UserRole,
    UserStatus,
    WorkflowLog,
    AuditLog
)

router = APIRouter()


@router.get("/test-no-auth")
async def test_endpoint():
    """Test endpoint without authentication"""
    return {
        "message": "Backend is working!",
        "timestamp": datetime.utcnow().isoformat(),
        "cors": "enabled"
    }


@router.get("/test-requests")
async def test_requests_endpoint():
    """Test requests endpoint without auth"""
    # Return mock data structure that matches what frontend expects
    return {
        "total": 4,
        "page": 1,
        "page_size": 100,
        "requests": [
            {
                "id": 1,
                "request_number": "REQ-20241103-TEST001",
                "title": "Test Request 1",
                "description": "This is a test request",
                "status": "submitted",
                "request_type": "bonafide_certificate",
                "priority": "medium",
                "created_at": "2024-11-03T08:00:00Z",
                "updated_at": "2024-11-03T08:00:00Z",
                "sla_due_date": "2024-11-05T08:00:00Z",
                "user_id": 1
            },
            {
                "id": 2,
                "request_number": "REQ-20241103-TEST002",
                "title": "Test Request 2",
                "description": "Another test request",
                "status": "under_review",
                "request_type": "transcript_request",
                "priority": "high",
                "created_at": "2024-11-02T14:00:00Z",
                "updated_at": "2024-11-03T09:00:00Z",
                "sla_due_date": "2024-11-04T14:00:00Z",
                "user_id": 1
            }
        ]
    }