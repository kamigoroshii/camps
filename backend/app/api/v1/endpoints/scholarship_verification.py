"""
API endpoints for automated scholarship verification
"""

import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, ServiceRequest, Document, RequestType, RequestStatus, WorkflowLog
from app.schemas import MessageResponse
from app.services.scholarship_verification import scholarship_verification_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scholarship-verification", tags=["Scholarship Verification"])


# ==================== SCHEMAS ====================

class ScholarshipApplicationRequest(BaseModel):
    full_name: str
    roll_number: str
    email: str
    program: str
    department: str
    academic_year: str
    scholarship_type: str
    family_income: Optional[float] = None
    additional_details: Optional[str] = None

class VerificationStatusResponse(BaseModel):
    request_id: int
    status: str
    confidence: float
    verification_results: dict
    decision: dict
    report: dict


class DocumentVerificationRequest(BaseModel):
    request_id: int
    document_id: int
    user_id: int


class BulkVerificationRequest(BaseModel):
    request_id: int


# ==================== ENDPOINTS ====================

@router.post("/submit-application")
async def submit_scholarship_application(
    application: ScholarshipApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a new scholarship application and get a request ID
    """
    try:
        # Create a new service request
        new_request = ServiceRequest(
            user_id=current_user.id,
            request_type=RequestType.SCHOLARSHIP,
            status=RequestStatus.SUBMITTED,
            details={
                "application_data": application.model_dump(),
                "submission_date": str(datetime.now()),
                "verification_status": "pending"
            },
            priority="normal"
        )
        
        db.add(new_request)
        await db.commit()
        await db.refresh(new_request)
        
        # Generate application number
        application_id = f"SCH-2024-{new_request.id:06d}"
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "Application submitted successfully",
                "request_id": new_request.id,
                "application_id": application_id,
                "status": "submitted",
                "next_steps": "Upload required documents for verification"
            }
        )
        
    except Exception as e:
        logger.error(f"Error submitting application: {e}")
        raise HTTPException(status_code=500, detail=f"Application submission failed: {str(e)}")

@router.post("/upload-and-verify")
async def upload_and_verify_document(
    request_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a scholarship document and run automated verification
    This endpoint:
    1. Uploads the document
    2. Extracts text using OCR
    3. Runs verification checks
    4. Returns verification results
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Verify request exists and user has access
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        if request.user_id != current_user.id and current_user.role.value not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Read file content
        file_content = await file.read()
        file_extension = '.' + file.filename.rsplit('.', 1)[-1].lower()
        
        # Create document record in database
        import os
        from datetime import datetime
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/scholarship_verification"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{request_id}_{document_type}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create document record
        new_document = Document(
            request_id=request_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=len(file_content),
            mime_type=file.content_type or "application/octet-stream",
            document_type=document_type,
            uploaded_by=current_user.id
        )
        
        db.add(new_document)
        await db.commit()
        await db.refresh(new_document)
        
        # Extract text with OCR
        logger.info(f"Extracting text from {file.filename} for request {request_id}")
        extracted_data = await scholarship_verification_service.extract_text_with_ocr(
            file_content, file_extension
        )
        
        # Update document with OCR text
        new_document.ocr_text = extracted_data.get('text', '')
        await db.commit()
        
        # Get user data for identity verification
        # Support both object and dict for current_user
        if isinstance(current_user, dict):
            user_data = {
                'full_name': current_user.get('full_name', ''),
                'student_id': current_user.get('student_id', ''),
                'department': current_user.get('department', ''),
                'email': current_user.get('email', '')
            }
        else:
            user_data = {
                'full_name': getattr(current_user, 'full_name', ''),
                'student_id': getattr(current_user, 'student_id', ''),
                'department': getattr(current_user, 'department', ''),
                'email': getattr(current_user, 'email', '')
            }
        
        # Run identity verification
        logger.info(f"Running identity verification for request {request_id}")
        identity_result = await scholarship_verification_service.verify_identity(
            extracted_data, user_data
        )
        
        # Run authenticity check
        logger.info(f"Running authenticity check for request {request_id}")
        authenticity_result = await scholarship_verification_service.verify_document_authenticity(
            file_content, file_extension, extracted_data
        )
        
        # Store verification results in request details
        verification_results = {
            "document_id": new_document.id,
            "document_type": document_type,
            "extraction": {
                "method": extracted_data.get('method'),
                "confidence": extracted_data.get('confidence'),
                "text_length": len(extracted_data.get('text', '')),
                "structured_data": extracted_data.get('structured_data', {})
            },
            "verification": {
                "identity": identity_result,
                "authenticity": authenticity_result
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Update request details with verification results
        if not request.request_data:
            request.request_data = {}
        
        if 'verification_results' not in request.request_data:
            request.request_data['verification_results'] = []
        
        request.request_data['verification_results'].append(verification_results)
        await db.commit()
        
        # Create workflow log entry
        workflow_log = WorkflowLog(
            request_id=request_id,
            action="document_uploaded_and_verified",
            to_status=request.status.value,
            performed_by=current_user.id,
            comments=f"Uploaded and verified {document_type}: {file.filename}",
            log_metadata=verification_results
        )
        db.add(workflow_log)
        await db.commit()
        
        # Return verification results
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and verified",
                "document_id": new_document.id,
                "document_name": file.filename,
                "document_type": document_type,
                "extraction": verification_results["extraction"],
                "verification": verification_results["verification"]
            }
        )
        
    except Exception as e:
        logger.error(f"Error in upload and verify: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/verify-request/{request_id}")
async def verify_scholarship_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Run comprehensive verification on all documents for a scholarship request
    This endpoint:
    1. Retrieves all uploaded documents
    2. Runs all verification checks
    3. Makes auto-approval/rejection decision
    4. Generates verification report
    """
    try:
        # Get request from database
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Verify user has access
        if request.user_id != current_user.id and current_user.role.value not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all documents for this request
        stmt = select(Document).where(Document.request_id == request_id)
        result = await db.execute(stmt)
        documents = result.scalars().all()
        
        if not documents:
            raise HTTPException(status_code=400, detail="No documents found for verification")
        
        logger.info(f"Starting comprehensive verification for request {request_id}")
        
        # Initialize results container
        all_results = {
            'identity': {},
            'authenticity': {},
            'validity': {},
            'completeness': {},
            'fraud': {}
        }
        
        # Get user data
        user_data = {
            'full_name': current_user.full_name,
            'student_id': current_user.student_id,
            'department': current_user.department,
            'email': current_user.email
        }
        
        # Process each document
        document_analyses = []
        for doc in documents:
            try:
                # Read document file
                with open(doc.file_path, 'rb') as f:
                    file_content = f.read()
                
                file_extension = '.' + doc.filename.rsplit('.', 1)[-1].lower()
                
                # Extract text
                extracted_data = await scholarship_verification_service.extract_text_with_ocr(
                    file_content, file_extension
                )
                
                # Run verifications
                identity_check = await scholarship_verification_service.verify_identity(
                    extracted_data, user_data
                )
                
                authenticity_check = await scholarship_verification_service.verify_document_authenticity(
                    file_content, file_extension, extracted_data
                )
                
                document_analyses.append({
                    'document_id': doc.id,
                    'document_name': doc.filename,
                    'document_type': doc.document_type,
                    'extracted_data': extracted_data,
                    'identity': identity_check,
                    'authenticity': authenticity_check
                })
                
                # Aggregate results (use worst-case for overall assessment)
                if not all_results['identity'] or identity_check.get('confidence', 0) < all_results['identity'].get('confidence', 1):
                    all_results['identity'] = identity_check
                
                if not all_results['authenticity'] or authenticity_check.get('confidence', 0) < all_results['authenticity'].get('confidence', 1):
                    all_results['authenticity'] = authenticity_check
                
            except Exception as e:
                logger.error(f"Error processing document {doc.id}: {e}")
                document_analyses.append({
                    'document_id': doc.id,
                    'document_name': doc.filename,
                    'error': str(e)
                })
        
        # Check data validity (example requirements)
        scholarship_requirements = {
            'min_grade': 7.0,  # Minimum CGPA
            'max_income': 600000  # Maximum annual family income
        }
        
        # Use first document's extracted data for validity check
        if document_analyses and 'extracted_data' in document_analyses[0]:
            validity_check = await scholarship_verification_service.verify_data_validity(
                document_analyses[0]['extracted_data'],
                scholarship_requirements
            )
            all_results['validity'] = validity_check
        
        # Check completeness
        required_documents = [
            'income_certificate',
            'grade_sheet',
            'bank_details',
            'id_proof'
        ]
        
        uploaded_doc_list = [
            {'document_type': doc.document_type} for doc in documents
        ]
        
        completeness_check = await scholarship_verification_service.check_completeness(
            uploaded_doc_list,
            required_documents
        )
        all_results['completeness'] = completeness_check
        
        # Fraud detection (check against previous submissions)
        # In production, query database for user's previous submissions
        document_history = []
        fraud_check = await scholarship_verification_service.ai_fraud_detection(
            document_analyses[0]['extracted_data'] if document_analyses else {},
            document_history
        )
        all_results['fraud'] = fraud_check
        
        # Make automated decision
        decision = await scholarship_verification_service.auto_decision(all_results)
        
        # Generate report
        report = await scholarship_verification_service.generate_verification_report(
            request_id,
            all_results,
            decision
        )
        
        # Update request status based on decision
        if decision['action'] == 'approve':
            request.status = RequestStatus.APPROVED
        elif decision['action'] == 'reject':
            request.status = RequestStatus.REJECTED
        else:
            request.status = RequestStatus.UNDER_REVIEW
        
        await db.commit()
        
        logger.info(f"Verification complete for request {request_id}: {decision['action']}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Verification completed",
                "request_id": request_id,
                "status": request.status.value,
                "confidence": decision.get('confidence', 0.0),
                "decision": decision,
                "verification_results": all_results,
                "document_analyses": document_analyses,
                "report": report
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in scholarship verification: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.get("/verification-status/{request_id}")
async def get_verification_status(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get verification status and results for a scholarship request
    """
    try:
        # Get request
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Verify access
        if request.user_id != current_user.id and current_user.role.value not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # In production, store verification results in database
        # For now, return request status
        return JSONResponse(
            status_code=200,
            content={
                "request_id": request_id,
                "status": request.status.value,
                "request_type": request.request_type.value,
                "created_at": request.created_at.isoformat(),
                "updated_at": request.updated_at.isoformat() if request.updated_at else None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting verification status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending-reviews")
async def get_pending_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of scholarship requests requiring manual review (Admin only)
    """
    try:
        # Check admin access
        if current_user.role.value not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Query requests under review
        stmt = select(ServiceRequest).where(
            ServiceRequest.request_type == RequestType.SCHOLARSHIP_APPLICATION,
            ServiceRequest.status == RequestStatus.UNDER_REVIEW
        ).order_by(ServiceRequest.created_at.desc())
        
        result = await db.execute(stmt)
        requests = result.scalars().all()
        
        pending_list = []
        for req in requests:
            pending_list.append({
                'request_id': req.id,
                'request_number': req.request_number,
                'user_id': req.user_id,
                'title': req.title,
                'status': req.status.value,
                'priority': req.priority.value,
                'created_at': req.created_at.isoformat(),
                'sla_due_date': req.sla_due_date.isoformat() if req.sla_due_date else None
            })
        
        return JSONResponse(
            status_code=200,
            content={
                "total": len(pending_list),
                "requests": pending_list
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting pending reviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/manual-review/{request_id}")
async def submit_manual_review(
    request_id: int,
    action: str = Form(...),  # 'approve' or 'reject'
    comments: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit manual review decision for flagged scholarship request (Admin only)
    """
    try:
        # Check admin access
        if current_user.role.value not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate action
        if action not in ['approve', 'reject']:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        # Get request
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Update status
        if action == 'approve':
            request.status = RequestStatus.APPROVED
        else:
            request.status = RequestStatus.REJECTED
        
        request.assigned_to = current_user.id
        
        # Create workflow log
        from app.models import WorkflowLog
        workflow_log = WorkflowLog(
            request_id=request_id,
            from_status=RequestStatus.UNDER_REVIEW.value,
            to_status=request.status.value,
            action=f"manual_{action}",
            performed_by=current_user.id,
            comments=comments
        )
        db.add(workflow_log)
        
        await db.commit()
        
        logger.info(f"Manual review completed for request {request_id}: {action} by user {current_user.id}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Request {action}d successfully",
                "request_id": request_id,
                "new_status": request.status.value,
                "reviewed_by": current_user.id,
                "comments": comments
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in manual review: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verification-report/{request_id}")
async def get_verification_report(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed verification report for a scholarship request
    """
    try:
        # Get request
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Verify access
        is_owner = request.user_id == current_user.id
        is_admin = current_user.role.value in ['admin', 'super_admin']
        
        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get workflow logs
        stmt = select(WorkflowLog).where(
            WorkflowLog.request_id == request_id
        ).order_by(WorkflowLog.created_at.desc())
        
        result = await db.execute(stmt)
        logs = result.scalars().all()
        
        workflow_history = [
            {
                'action': log.action,
                'from_status': log.from_status,
                'to_status': log.to_status,
                'comments': log.comments,
                'performed_by': log.performed_by,
                'created_at': log.created_at.isoformat()
            }
            for log in logs
        ]
        
        # Get documents
        stmt = select(Document).where(Document.request_id == request_id)
        result = await db.execute(stmt)
        documents = result.scalars().all()
        
        document_list = [
            {
                'id': doc.id,
                'filename': doc.filename,
                'document_type': doc.document_type,
                'is_verified': doc.is_verified,
                'created_at': doc.created_at.isoformat()
            }
            for doc in documents
        ]
        
        return JSONResponse(
            status_code=200,
            content={
                "request_id": request_id,
                "request_number": request.request_number,
                "request_type": request.request_type.value,
                "status": request.status.value,
                "priority": request.priority.value,
                "created_at": request.created_at.isoformat(),
                "updated_at": request.updated_at.isoformat() if request.updated_at else None,
                "documents": document_list,
                "workflow_history": workflow_history,
                "assigned_to": request.assigned_to
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting verification report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AdminDecisionRequest(BaseModel):
    decision: str  # "approve", "reject", "request_more_info"
    comments: Optional[str] = None
    admin_notes: Optional[str] = None


@router.post("/admin-decision/{request_id}")
async def make_admin_decision(
    request_id: int,
    decision_data: AdminDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to approve/reject scholarship applications
    """
    try:
        # Check admin access
        if current_user.role.value not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get request
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Update request status based on decision
        old_status = request.status.value
        
        if decision_data.decision == "approve":
            request.status = RequestStatus.APPROVED
            new_status = "approved"
        elif decision_data.decision == "reject":
            request.status = RequestStatus.REJECTED
            new_status = "rejected"
        elif decision_data.decision == "request_more_info":
            request.status = RequestStatus.PENDING_APPROVAL
            new_status = "pending_approval"
        else:
            raise HTTPException(status_code=400, detail="Invalid decision")
        
        request.assigned_to = current_user.id
        request.updated_at = datetime.now()
        
        # Store admin decision in request data
        if not request.request_data:
            request.request_data = {}
        
        request.request_data['admin_decision'] = {
            "decision": decision_data.decision,
            "decided_by": current_user.id,
            "decided_at": datetime.now().isoformat(),
            "comments": decision_data.comments,
            "admin_notes": decision_data.admin_notes
        }
        
        await db.commit()
        
        # Create workflow log
        workflow_log = WorkflowLog(
            request_id=request_id,
            from_status=old_status,
            to_status=new_status,
            action=f"admin_decision_{decision_data.decision}",
            performed_by=current_user.id,
            comments=decision_data.comments or f"Admin {decision_data.decision} decision",
            log_metadata={
                "decision": decision_data.decision,
                "admin_notes": decision_data.admin_notes
            }
        )
        
        db.add(workflow_log)
        await db.commit()
        
        # TODO: Send notification to user about decision
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Application {decision_data.decision}d successfully",
                "request_id": request_id,
                "new_status": new_status,
                "decision": decision_data.decision,
                "decided_by": current_user.id,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error making admin decision: {e}")
        raise HTTPException(status_code=500, detail=str(e))
