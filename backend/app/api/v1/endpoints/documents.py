from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import os
import aiofiles
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models import Document, ServiceRequest
from app.schemas import DocumentResponse, MessageResponse

router = APIRouter()


async def save_upload_file(file: UploadFile, request_id: int) -> tuple:
    """Save uploaded file and return file info"""
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{request_id}_{timestamp}_{file.filename}"
    
    # Create upload directory if not exists
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(request_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    file_size = len(content)
    
    return unique_filename, file_path, file_size


@router.post("/upload/{request_id}", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document for a request"""
    user_id = int(current_user.get("sub"))
    
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
    
    if request.user_id != user_id and current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1].lower().replace(".", "")
    if file_extension not in settings.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
        )
    
    # Save file
    unique_filename, file_path, file_size = await save_upload_file(file, request_id)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        # Remove file if too large
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE} bytes"
        )
    
    # Create document record
    document = Document(
        request_id=request_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=user_id
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return document


@router.get("/{request_id}", response_model=List[DocumentResponse])
async def list_documents(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List documents for a request"""
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
    
    # Get documents
    result = await db.execute(
        select(Document).where(Document.request_id == request_id)
    )
    documents = result.scalars().all()
    
    return [DocumentResponse.model_validate(doc) for doc in documents]


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document"""
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check permissions
    if document.uploaded_by != user_id and user_role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete file from storage
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete document record
    await db.delete(document)
    await db.commit()
    
    return MessageResponse(message="Document deleted successfully")
