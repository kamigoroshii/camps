from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    """User role enumeration"""
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, enum.Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for SSO users
    full_name = Column(String(255), nullable=False)
    student_id = Column(String(50), unique=True, nullable=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=True, index=True)
    
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    department = Column(String(100), nullable=True)
    course = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    phone = Column(String(20), nullable=True)
    
    is_verified = Column(Boolean, default=False)
    is_sso_user = Column(Boolean, default=False)
    
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    requests = relationship("ServiceRequest", foreign_keys="ServiceRequest.user_id", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class RequestType(str, enum.Enum):
    """Request type enumeration"""
    # Certificates
    BONAFIDE_CERTIFICATE = "bonafide_certificate"
    CHARACTER_CERTIFICATE = "character_certificate"
    TRANSFER_CERTIFICATE = "transfer_certificate"
    DEGREE_CERTIFICATE = "degree_certificate"
    
    # Financial
    FEE_RECEIPT = "fee_receipt"
    SCHOLARSHIP_APPLICATION = "scholarship_application"
    REFUND_REQUEST = "refund_request"
    
    # Academic
    TRANSCRIPT_REQUEST = "transcript_request"
    COURSE_REGISTRATION = "course_registration"
    EXAM_FORM = "exam_form"
    GRADE_REVALUATION = "grade_revaluation"
    
    # Administrative
    ID_CARD_REQUEST = "id_card_request"
    LIBRARY_NO_DUES = "library_no_dues"
    HOSTEL_APPLICATION = "hostel_application"
    EVENT_PERMISSION = "event_permission"


class RequestStatus(str, enum.Enum):
    """Request status enumeration"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Priority(str, enum.Enum):
    """Priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ServiceRequest(Base):
    """Service request model"""
    __tablename__ = "service_requests"
    
    id = Column(String(64), primary_key=True, index=True)
    request_number = Column(String(50), unique=True, index=True, nullable=False)
    
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    request_type = Column(SQLEnum(RequestType), nullable=False)
    status = Column(SQLEnum(RequestStatus), default=RequestStatus.DRAFT, nullable=False)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM, nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    request_data = Column(JSON, nullable=True)  # Store form-specific data
    verification_score = Column(Float, nullable=True)  # Scholarship verification score
    
    assigned_to = Column(String(64), ForeignKey("users.id"), nullable=True)
    department = Column(String(100), nullable=True)
    
    sla_due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="requests")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    documents = relationship("Document", back_populates="request", cascade="all, delete-orphan")
    workflow_logs = relationship("WorkflowLog", back_populates="request", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="request", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ServiceRequest {self.request_number} ({self.status})>"


class Document(Base):
    """Document model"""
    __tablename__ = "documents"
    
    id = Column(String(64), primary_key=True, index=True)
    request_id = Column(String(64), ForeignKey("service_requests.id"), nullable=False)
    
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    document_type = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=False)
    ocr_text = Column(Text, nullable=True)
    
    uploaded_by = Column(String(64), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    request = relationship("ServiceRequest", back_populates="documents")
    uploader = relationship("User")
    
    def __repr__(self):
        return f"<Document {self.filename}>"


class WorkflowLog(Base):
    """Workflow log model for tracking request progress"""
    __tablename__ = "workflow_logs"
    
    id = Column(String(64), primary_key=True, index=True)
    request_id = Column(String(64), ForeignKey("service_requests.id"), nullable=False)
    
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    
    performed_by = Column(String(64), ForeignKey("users.id"), nullable=False)
    comments = Column(Text, nullable=True)
    log_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    request = relationship("ServiceRequest", back_populates="workflow_logs")
    user = relationship("User")
    
    def __repr__(self):
        return f"<WorkflowLog {self.action} on Request {self.request_id}>"


class Comment(Base):
    """Comment model"""
    __tablename__ = "comments"
    
    id = Column(String(64), primary_key=True, index=True)
    request_id = Column(String(64), ForeignKey("service_requests.id"), nullable=False)
    
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal admin comments
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    request = relationship("ServiceRequest", back_populates="comments")
    user = relationship("User")
    
    def __repr__(self):
        return f"<Comment on Request {self.request_id}>"


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # email, sms, push, in_app
    
    is_read = Column(Boolean, default=False)
    request_id = Column(String(64), ForeignKey("service_requests.id"), nullable=True)
    
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.title}>"


class AuditLog(Base):
    """Audit log model"""
    __tablename__ = "audit_logs"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(64), nullable=True)
    
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type}>"
