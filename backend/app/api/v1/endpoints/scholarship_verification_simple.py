"""
Simple Scholarship Verification API
Clean implementation for document verification workflow
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime
import uuid
import os
import re
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import ServiceRequest, Document, User, RequestType, RequestStatus, Priority
from app.services.scholarship_verification import scholarship_verification_service
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("uploads/scholarship_verification")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==================== Schemas ====================

class ApplicationSubmitRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    course: str
    year_of_study: str
    reason: str


class ApplicationResponse(BaseModel):
    success: bool
    message: str
    request_id: str
    application_number: str


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    verification_status: str


class ApplicationStatusResponse(BaseModel):
    request_id: str
    application_number: str
    status: str
    submitted_date: str
    documents: List[dict]


# ==================== Endpoints ====================

@router.post("/submit", response_model=ApplicationResponse)
async def submit_application(
    data: ApplicationSubmitRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a new scholarship application"""
    try:
        # Generate IDs
        request_id = str(uuid.uuid4())
        app_number = f"SCH-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create service request
        service_request = ServiceRequest(
            id=request_id,
            user_id=str(current_user.get("sub")),
            request_type=RequestType.SCHOLARSHIP_APPLICATION,
            request_number=app_number,
            status=RequestStatus.SUBMITTED,
            priority=Priority.MEDIUM,
            title=f"Scholarship Application - {data.full_name}",
            description=f"Scholarship application for {data.course}, Year {data.year_of_study}",
            request_data={
                "full_name": data.full_name,
                "email": data.email,
                "phone": data.phone,
                "course": data.course,
                "year_of_study": data.year_of_study,
                "reason": data.reason,
                "submitted_at": datetime.now().isoformat()
            }
        )
        
        db.add(service_request)
        await db.commit()
        
        return ApplicationResponse(
            success=True,
            message="Application submitted successfully",
            request_id=request_id,
            application_number=app_number
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit application: {str(e)}")


@router.post("/upload/{request_id}", response_model=DocumentUploadResponse)
async def upload_document(
    request_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload and verify a document for an application"""
    try:
        user_id = str(current_user.get("sub"))
        
        # Log the request for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Upload request: request_id={request_id}, user_id={user_id}, document_type={document_type}")
        
        # Verify request exists and belongs to user
        result = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.id == request_id,
                ServiceRequest.user_id == user_id
            )
        )
        service_request = result.scalar_one_or_none()
        
        if not service_request:
            logger.error(f"Application not found: request_id={request_id}, user_id={user_id}")
            raise HTTPException(status_code=404, detail=f"Application not found for ID: {request_id}")
        
        # Sanitize document_type for filename (remove special characters)
        safe_doc_type = re.sub(r'[^\w\s-]', '', document_type).replace(' ', '_')
        
        # Save file
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{request_id}_{safe_doc_type}_{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Create document record
        document_id = str(uuid.uuid4())
        document = Document(
            id=document_id,
            request_id=request_id,
            document_type=document_type,
            filename=filename,
            original_filename=file.filename,
            file_path=str(file_path),
            file_size=len(content),
            mime_type=file.content_type or "application/octet-stream",
            uploaded_by=str(current_user.get("sub")),
            is_verified=False
        )
        
        db.add(document)
        
        # Run OCR and verification
        try:
            logger.info(f"Running OCR on document: {filename}")
            
            # Extract text using OCR
            extracted_data = await scholarship_verification_service.extract_text_with_ocr(
                content, file_extension
            )
            
            # Store OCR text
            document.ocr_text = extracted_data.get('text', '')[:5000]  # Limit to 5000 chars
            
            # Get application data for verification
            application_data = service_request.request_data or {}
            
            # Run verification checks
            logger.info(f"Running verification checks for document: {document_type}")
            
            # Identity verification
            identity_check = await scholarship_verification_service.verify_identity(
                extracted_data, application_data
            )
            
            # Document authenticity check
            authenticity_check = await scholarship_verification_service.verify_document_authenticity(
                content, file_extension, extracted_data
            )
            
            # Calculate overall verification status
            identity_confidence = identity_check.get('confidence', 0.0)
            authenticity_confidence = authenticity_check.get('confidence', 0.0)
            overall_confidence = (identity_confidence + authenticity_confidence) / 2
            
            # Mark as verified if confidence is above threshold (70%)
            document.is_verified = overall_confidence >= 0.7
            
            # Store verification results in request_data
            if not service_request.request_data:
                service_request.request_data = {}
            
            if 'verification_results' not in service_request.request_data:
                service_request.request_data['verification_results'] = {}
            
            service_request.request_data['verification_results'][document_type] = {
                'document_id': document_id,
                'ocr_confidence': extracted_data.get('confidence', 0.0),
                'identity_check': identity_check,
                'authenticity_check': authenticity_check,
                'overall_confidence': overall_confidence,
                'verified_at': datetime.now().isoformat()
            }
            
            # Update verification score for the request
            if service_request.verification_score is None:
                service_request.verification_score = overall_confidence
            else:
                # Average of all document verifications
                service_request.verification_score = (
                    service_request.verification_score + overall_confidence
                ) / 2
            
            logger.info(
                f"Verification complete: document={document_type}, "
                f"confidence={overall_confidence:.2f}, verified={document.is_verified}"
            )
            
        except Exception as e:
            logger.error(f"Error during OCR/verification: {e}")
            # Still save the document even if verification fails
            document.is_verified = False
            document.ocr_text = f"Verification failed: {str(e)}"
        
        await db.commit()
        
        verification_status = "verified" if document.is_verified else "pending_review"
        
        return DocumentUploadResponse(
            success=True,
            message=f"Document uploaded and {verification_status}",
            document_id=document_id,
            verification_status=verification_status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")


@router.get("/status/{request_id}", response_model=ApplicationStatusResponse)
async def get_application_status(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get application status and documents"""
    try:
        # Get request
        result = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.id == request_id,
                ServiceRequest.user_id == str(current_user.get("sub"))
            )
        )
        service_request = result.scalar_one_or_none()
        
        if not service_request:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get documents
        doc_result = await db.execute(
            select(Document).where(Document.request_id == request_id)
        )
        documents = doc_result.scalars().all()
        
        doc_list = [
            {
                "id": doc.id,
                "type": doc.document_type,
                "filename": doc.original_filename,
                "status": "verified" if doc.is_verified else "pending",
                "uploaded_at": doc.created_at.isoformat() if doc.created_at else None
            }
            for doc in documents
        ]
        
        return ApplicationStatusResponse(
            request_id=service_request.id,
            application_number=service_request.request_number,
            status=service_request.status,
            submitted_date=service_request.created_at.isoformat() if service_request.created_at else None,
            documents=doc_list
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/document/{document_id}")
async def view_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """View/download a document"""
    try:
        user_id = str(current_user.get("sub"))
        
        # Get document
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Verify user has access to this document
        req_result = await db.execute(
            select(ServiceRequest).where(ServiceRequest.id == document.request_id)
        )
        service_request = req_result.scalar_one_or_none()
        
        if not service_request or service_request.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if file exists
        file_path = Path(document.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on server")
        
        # Return file
        return FileResponse(
            path=str(file_path),
            filename=document.original_filename,
            media_type=document.mime_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")


@router.get("/verification-details/{request_id}")
async def get_verification_details(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed verification results for an application"""
    try:
        user_id = str(current_user.get("sub"))
        
        # Get request
        result = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.id == request_id,
                ServiceRequest.user_id == user_id
            )
        )
        service_request = result.scalar_one_or_none()
        
        if not service_request:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get documents with OCR text
        doc_result = await db.execute(
            select(Document).where(Document.request_id == request_id)
        )
        documents = doc_result.scalars().all()
        
        doc_details = [
            {
                "id": doc.id,
                "type": doc.document_type,
                "filename": doc.original_filename,
                "is_verified": doc.is_verified,
                "ocr_text": doc.ocr_text[:500] if doc.ocr_text else None,  # First 500 chars
                "uploaded_at": doc.created_at.isoformat() if doc.created_at else None
            }
            for doc in documents
        ]
        
        verification_results = service_request.request_data.get('verification_results', {}) if service_request.request_data else {}
        
        return {
            "success": True,
            "request_id": request_id,
            "application_number": service_request.request_number,
            "overall_score": service_request.verification_score,
            "status": service_request.status.value if hasattr(service_request.status, 'value') else str(service_request.status),
            "documents": doc_details,
            "verification_results": verification_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get verification details: {str(e)}")


@router.get("/my-applications")
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all applications for current user"""
    try:
        user_id = str(current_user.get("sub"))
        
        logger.info(f"Fetching applications for user_id={user_id}")
        
        result = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.user_id == user_id,
                ServiceRequest.request_type == RequestType.SCHOLARSHIP_APPLICATION
            ).order_by(ServiceRequest.created_at.desc())
        )
        requests = result.scalars().all()
        
        logger.info(f"Found {len(requests)} applications for user_id={user_id}")
        
        applications = [
            {
                "request_id": req.id,
                "application_number": req.request_number,
                "status": req.status.value if hasattr(req.status, 'value') else str(req.status),
                "submitted_date": req.created_at.isoformat() if req.created_at else None,
                "data": req.request_data
            }
            for req in requests
        ]
        
        return {
            "success": True,
            "applications": applications
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get applications: {str(e)}")


@router.delete("/delete/{request_id}")
async def delete_application(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a scholarship application and all its documents"""
    try:
        user_id = str(current_user.get("sub"))
        
        # Get the request to verify ownership
        result = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.id == request_id,
                ServiceRequest.user_id == user_id
            )
        )
        service_request = result.scalar_one_or_none()
        
        if not service_request:
            raise HTTPException(status_code=404, detail="Application not found or you don't have permission to delete it")
        
        # Get all documents for this request
        doc_result = await db.execute(
            select(Document).where(Document.request_id == request_id)
        )
        documents = doc_result.scalars().all()
        
        # Delete physical files
        for doc in documents:
            try:
                file_path = Path(doc.file_path)
                if file_path.exists():
                    os.remove(file_path)
                    logger.info(f"Deleted file: {file_path}")
            except Exception as e:
                logger.error(f"Error deleting file {doc.file_path}: {e}")
        
        # Delete documents from database
        for doc in documents:
            await db.delete(doc)
        
        # Delete the service request
        await db.delete(service_request)
        
        await db.commit()
        
        logger.info(f"Deleted application {request_id} with {len(documents)} documents")
        
        return {
            "success": True,
            "message": f"Application {service_request.request_number} deleted successfully",
            "deleted_documents": len(documents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}")


# Admin endpoints

@router.get("/admin/pending")
async def get_pending_applications(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending applications (admin only)"""
    try:
        # TODO: Add admin role check
        
        result = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.request_type == RequestType.SCHOLARSHIP_APPLICATION,
                ServiceRequest.status.in_([RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW])
            ).order_by(ServiceRequest.created_at.desc())
        )
        requests = result.scalars().all()
        
        applications = []
        for req in requests:
            # Get documents count
            doc_result = await db.execute(
                select(Document).where(Document.request_id == req.id)
            )
            docs = doc_result.scalars().all()
            
            applications.append({
                "request_id": req.id,
                "application_number": req.request_number,
                "status": req.status,
                "submitted_date": req.created_at.isoformat() if req.created_at else None,
                "data": req.request_data,
                "documents_count": len(docs)
            })
        
        return {
            "success": True,
            "applications": applications
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pending applications: {str(e)}")


@router.post("/admin/review/{request_id}")
async def update_application_status(
    request_id: str,
    status: str = Form(...),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update application status (admin only)"""
    try:
        # TODO: Add admin role check
        
        result = await db.execute(
            select(ServiceRequest).where(ServiceRequest.id == request_id)
        )
        service_request = result.scalar_one_or_none()
        
        if not service_request:
            raise HTTPException(status_code=404, detail="Application not found")
        
        service_request.status = status
        if notes:
            service_request.notes = notes
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Application status updated to {status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")
