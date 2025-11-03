"""
MongoDB-based Authentication endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_mongo_user
)
from app.models.mongo_models import (
    MongoUser,
    UserCreate,
    UserResponse,
    UserStatus
)
from app.services.mongo_user_service import mongo_user_service
from app.schemas import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserRegistrationResponse
)

router = APIRouter()


@router.post("/register", response_model=UserRegistrationResponse, tags=["Authentication"])
async def register(user_data: UserCreate):
    """
    Register a new user with MongoDB
    """
    try:
        # Check if user already exists
        existing_user = await mongo_user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        existing_user = await mongo_user_service.get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )
        
        # Create new user
        new_user = await mongo_user_service.create_user(user_data)
        
        return {
            "message": "User registered successfully",
            "user_id": str(new_user.id),
            "email": new_user.email,
            "username": new_user.username,
            "status": "pending_verification"
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login", response_model=TokenResponse, tags=["Authentication"])
async def login(login_data: LoginRequest):
    """
    Authenticate user and return JWT tokens
    """
    try:
        # Authenticate user
        user = await mongo_user_service.authenticate_user(
            login_data.username_or_email, 
            login_data.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is not active. Please contact administrator.",
            )
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id), "username": user.username})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "status": user.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login/oauth", response_model=TokenResponse, tags=["Authentication"])
async def oauth_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible login endpoint
    """
    try:
        # Authenticate user
        user = await mongo_user_service.authenticate_user(form_data.username, form_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is not active",
            )
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id), "username": user.username})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "status": user.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/refresh", response_model=TokenResponse, tags=["Authentication"])
async def refresh_token(refresh_data: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        # Decode refresh token
        payload = decode_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user
        user = await mongo_user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is not active"
            )
        
        # Create new tokens
        access_token = create_access_token(data={"sub": str(user.id), "username": user.username})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "status": user.status
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user_info(current_user: MongoUser = Depends(get_current_mongo_user)):
    """
    Get current authenticated user information
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        student_id=current_user.student_id,
        employee_id=current_user.employee_id,
        role=current_user.role,
        status=current_user.status,
        department=current_user.department,
        course=current_user.course,
        year=current_user.year,
        phone=current_user.phone,
        is_verified=current_user.is_verified,
        is_sso_user=current_user.is_sso_user,
        last_login=current_user.last_login,
        created_at=current_user.created_at
    )


@router.post("/logout", tags=["Authentication"])
async def logout():
    """
    Logout user (client should remove tokens)
    """
    return {"message": "Successfully logged out"}


@router.get("/health", tags=["Authentication"])
async def auth_health_check():
    """
    Health check for authentication service
    """
    try:
        # Test MongoDB connection
        users_count = await mongo_user_service.count_users()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "mongodb",
            "users_count": users_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unhealthy: {str(e)}"
        )