from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, UserStatus, RequestType, RequestStatus, Priority


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    role: UserRole = UserRole.STUDENT


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None


class UserResponse(UserBase):
    id: int
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    role: UserRole
    status: UserStatus
    is_verified: bool
    is_sso_user: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Authentication Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Service Request Schemas
class ServiceRequestBase(BaseModel):
    request_type: RequestType
    title: str = Field(..., min_length=5, max_length=255)
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    request_data: Optional[dict] = None


class ServiceRequestCreate(ServiceRequestBase):
    pass


class ServiceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[RequestStatus] = None
    request_data: Optional[dict] = None


class ServiceRequestResponse(ServiceRequestBase):
    id: int
    request_number: str
    user_id: int
    status: RequestStatus
    assigned_to: Optional[int] = None
    department: Optional[str] = None
    sla_due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ServiceRequestListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    requests: List[ServiceRequestResponse]


# Document Schemas
class DocumentUpload(BaseModel):
    document_type: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    request_id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    document_type: Optional[str] = None
    is_verified: bool
    uploaded_by: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Comment Schemas
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False


class CommentResponse(BaseModel):
    id: int
    request_id: int
    user_id: int
    content: str
    is_internal: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Workflow Schemas
class WorkflowAction(BaseModel):
    action: str
    to_status: RequestStatus
    comments: Optional[str] = None
    metadata: Optional[dict] = None


class WorkflowLogResponse(BaseModel):
    id: int
    request_id: int
    from_status: Optional[str] = None
    to_status: str
    action: str
    performed_by: int
    comments: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    request_id: Optional[int] = None
    sent_at: datetime
    read_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Dashboard/Analytics Schemas
class DashboardStats(BaseModel):
    total_requests: int
    pending_requests: int
    approved_requests: int
    rejected_requests: int
    completed_requests: int
    avg_processing_time: float  # in hours
    sla_compliance_rate: float  # percentage


class RequestTypeStats(BaseModel):
    request_type: str
    count: int
    avg_processing_time: float


# Generic Response
class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
