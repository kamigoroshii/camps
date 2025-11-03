"""
MongoDB models for user authentication
"""

from datetime import datetime
from typing import Optional, Any, List
from enum import Enum
from pydantic import BaseModel, Field, field_validator
from pydantic_core import core_schema
from bson import ObjectId
from app.api.v1.memo_card_api import router as memo_card_router


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any) -> core_schema.CoreSchema:
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ], serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class UserRole(str, Enum):
    """User role enumeration"""
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class MongoUser(BaseModel):
    """MongoDB User model"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str = Field(..., unique=True, index=True)
    username: str = Field(..., unique=True, index=True)
    hashed_password: Optional[str] = None  # Nullable for SSO users
    full_name: str
    student_id: Optional[str] = Field(None, unique=True, index=True)
    employee_id: Optional[str] = Field(None, unique=True, index=True)
    
    role: UserRole = UserRole.STUDENT
    status: UserStatus = UserStatus.ACTIVE
    
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None
    
    is_verified: bool = False
    is_sso_user: bool = False
    
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "email": "student@university.edu",
                "username": "student123",
                "full_name": "John Doe",
                "student_id": "S12345",
                "role": "student",
                "department": "Computer Science",
                "course": "B.Tech",
                "year": 2
            }
        }}


class UserCreate(BaseModel):
    """User creation schema"""
    email: str
    username: str
    password: str
    full_name: str
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    role: UserRole = Field(default=UserRole.STUDENT)
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "student@example.com",
                "username": "student123",
                "password": "password123",
                "full_name": "John Doe",
                "student_id": "S12345"
            }
        }
    }


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None
    status: Optional[UserStatus] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    username: str
    full_name: str
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    role: UserRole
    status: UserStatus
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None
    is_verified: bool
    is_sso_user: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# ==================== Scholarship Verification Models ====================

class VerificationStatus(str, Enum):
    """Verification status enumeration"""
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    REVIEW_REQUIRED = "review_required"
    ERROR = "error"


class RiskLevel(str, Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ScholarshipVerificationResult(BaseModel):
    """MongoDB model for storing scholarship verification results"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    request_id: int  # Reference to ServiceRequest in PostgreSQL
    user_id: str  # MongoDB user ID
    
    # OCR and extraction results
    ocr_results: dict = Field(default_factory=dict)
    extracted_data: dict = Field(default_factory=dict)
    
    # Verification results
    identity_verification: dict = Field(default_factory=dict)
    authenticity_verification: dict = Field(default_factory=dict)
    validity_verification: dict = Field(default_factory=dict)
    completeness_verification: dict = Field(default_factory=dict)
    fraud_detection: dict = Field(default_factory=dict)
    
    # Overall assessment
    overall_status: VerificationStatus = VerificationStatus.PENDING
    confidence_score: float = 0.0
    risk_level: RiskLevel = RiskLevel.LOW
    
    # Decision
    automated_decision: Optional[str] = None  # 'approve', 'reject', 'review'
    requires_manual_review: bool = False
    review_priority: str = "normal"
    
    # Manual review
    manual_review_by: Optional[str] = None
    manual_review_at: Optional[datetime] = None
    manual_review_comments: Optional[str] = None
    final_decision: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class DocumentVerificationResult(BaseModel):
    """MongoDB model for storing individual document verification results"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    document_id: int  # Reference to Document in PostgreSQL
    request_id: int
    user_id: str
    
    # Document details
    document_name: str
    document_type: str
    file_extension: str
    
    # OCR results
    ocr_method: str
    ocr_confidence: float = 0.0
    extracted_text: str = ""
    structured_fields: dict = Field(default_factory=dict)
    
    # Authenticity checks
    has_watermark: bool = False
    has_stamp: bool = False
    has_signature: bool = False
    image_quality_score: float = 0.0
    
    # Verification status
    is_authentic: bool = False
    authenticity_confidence: float = 0.0
    issues: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class VerificationAuditLog(BaseModel):
    """Audit log for verification activities"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    request_id: int
    user_id: str
    
    action: str  # 'ocr_extraction', 'identity_check', 'fraud_detection', etc.
    status: str
    details: dict = Field(default_factory=dict)
    
    performed_by: Optional[str] = None  # System or admin user
    ip_address: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


# ==================== Memo Card Models ====================
class MemoCard(BaseModel):
    """MongoDB model for storing memo cards"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "title": "Exam Reminder",
                "content": "Don't forget the math exam on Friday!",
            }
        }
    }

