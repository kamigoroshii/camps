"""
MongoDB models for user authentication
"""

from datetime import datetime
from typing import Optional, Any
from enum import Enum
from pydantic import BaseModel, Field, field_validator
from pydantic_core import core_schema
from bson import ObjectId


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