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
from app.services.notification_service import notification_service
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
    request_id: str
    status: str
    confidence: float
    verification_results: dict
    decision: dict
    report: dict


class DocumentVerificationRequest(BaseModel):
    request_id: str
    document_id: str
    user_id: str


class BulkVerificationRequest(BaseModel):
    request_id: str


# ==================== ENDPOINTS ====================

@router.post("/submit-application")
async def submit_scholarship_application(
    application: ScholarshipApplicationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a new scholarship application and get a request ID
    """
    try:
        # Get user ID from token payload
        user_id = current_user.get("sub")
        
        # Generate unique request ID and number
        import uuid
        request_id = str(uuid.uuid4())
        request_number = f"REQ-{datetime.now().strftime('%Y%m%d')}-{request_id[:8].upper()}"
        
        # Create a new service request
        new_request = ServiceRequest(
            id=request_id,
            request_number=request_number,
            user_id=user_id,
            request_type=RequestType.SCHOLARSHIP_APPLICATION,
            status=RequestStatus.SUBMITTED,
            title="Scholarship Application",
            description=f"Scholarship application for {application.full_name}",
            request_data={
                "application_data": application.model_dump(),
                "submission_date": str(datetime.now()),
                "verification_status": "pending"
            },
            priority="medium"
        )
        
        db.add(new_request)
        await db.commit()
        await db.refresh(new_request)
        
        # Generate application number
        application_id = f"SCH-2024-{new_request.id}"
        
        # Send notification to user
        await notification_service.send_scholarship_status_notification(
            db=db,
            user_id=user_id,
            request=new_request,
            status_change="submitted"
        )
        
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
    request_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a scholarship document and run automated verification.
    Steps:
    1. Validate file and access
    2. Save file to disk and create Document record
    3. Run OCR and verification checks
    4. Persist results and create workflow log
    5. Notify user and return verification summary
    """
    try:
        # Get user id
        user_id = current_user.get("sub")

        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Ensure request exists and user has access
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        if request.user_id != user_id and current_user.get("role") not in ['admin', 'super_admin']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Read file and save
        file_content = await file.read()
        file_extension = '.' + file.filename.rsplit('.', 1)[-1].lower()
        import os, uuid
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{request_id}_{document_type}{file_extension}"
        upload_dir = os.path.join("uploads", "scholarship_verification")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        with open(file_path, 'wb') as fh:
            fh.write(file_content)

        # Create Document record
        doc_id = str(uuid.uuid4())
        new_document = Document(
            id=doc_id,
            request_id=request_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=len(file_content),
            mime_type=file.content_type or 'application/octet-stream',
            document_type=document_type,
            uploaded_by=user_id
        )
        db.add(new_document)
        await db.commit()
        await db.refresh(new_document)

        # OCR and verification
        logger.info(f"Extracting text from {file.filename} for request {request_id}")
        extracted = await scholarship_verification_service.extract_text_with_ocr(file_content, file_extension)

        # Basic verification calls (service returns dicts)
        identity = await scholarship_verification_service.verify_identity(extracted, request.request_data.get('application_data', {}))
        authenticity = await scholarship_verification_service.verify_document_authenticity(extracted)
        validity = await scholarship_verification_service.verify_document_data(extracted, request.request_data.get('application_data', {}))

        verification_results = {
            'extraction': extracted,
            'verification': {
                'identity': identity,
                'authenticity': authenticity,
                'validity': validity
            }
        }

        # Persist OCR text and verification results
        new_document.ocr_text = extracted.get('text', '')
        if not request.request_data:
            request.request_data = {}
        request.request_data.setdefault('verification_results', [])
        request.request_data['verification_results'].append(verification_results)
        await db.commit()

        # Workflow log
        workflow_log = WorkflowLog(
            id=str(uuid.uuid4()),
            request_id=request_id,
            action='document_uploaded_and_verified',
            from_status=request.status.value if hasattr(request.status, 'value') else str(request.status),
            to_status=request.status.value if hasattr(request.status, 'value') else str(request.status),
            performed_by=user_id,
            comments=f'Uploaded and verified {document_type}: {file.filename}',
            log_metadata=verification_results
        )
        db.add(workflow_log)
        await db.commit()

        # Notify
        await notification_service.send_scholarship_status_notification(
            db=db,
            user_id=user_id,
            request=request,
            status_change='document_uploaded',
            additional_info={'document_name': file.filename}
        )

        return JSONResponse(status_code=200, content={
            'message': 'Document uploaded and verified',
            'document_id': new_document.id,
            'document_name': file.filename,
            'document_type': document_type,
            'extraction': verification_results['extraction'],
            'verification': verification_results['verification']
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Error in upload_and_verify: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-request/{request_id}")
async def verify_scholarship_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Run comprehensive verification on all documents for a scholarship request.
    This endpoint:
    1. Retrieves all uploaded documents
    2. Runs all verification checks
    3. Makes auto-approval/rejection decision
    4. Generates verification report
    """
    try:
        # Get user ID from token payload
        user_id = current_user.get("sub")
        
        # Get request from database
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Verify user has access
        if request.user_id != user_id and current_user.get("role") not in ['admin', 'super_admin']:
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
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get verification status and results for a scholarship request
    """
    try:
        # Get user ID from token payload
        user_id = current_user.get("sub")
        
        # Get request
        request = await db.get(ServiceRequest, request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Verify access
        if request.user_id != user_id and current_user.get("role") not in ['admin', 'super_admin']:
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
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of scholarship requests requiring manual review (Admin only)
    """
    try:
        # Check admin access
        if current_user.get("role") not in ['admin', 'super_admin']:
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
    request_id: str,
    action: str = Form(...),  # 'approve' or 'reject'
    comments: str = Form(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit manual review decision for flagged scholarship request (Admin only)
    """
    try:
        # Check admin access
        if current_user.get("role") not in ['admin', 'super_admin']:
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
        
        request.assigned_to = current_user.get("sub")
        
        # Create workflow log
        from app.models import WorkflowLog
        workflow_log = WorkflowLog(
            request_id=request_id,
            from_status=RequestStatus.UNDER_REVIEW.value,
            to_status=request.status.value,
            action=f"manual_{action}",
            performed_by=current_user.get("sub"),
            comments=comments
        )
        db.add(workflow_log)
        
        await db.commit()
        
        logger.info(f"Manual review completed for request {request_id}: {action} by user {current_user.get('sub')}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Request {action}d successfully",
                "request_id": request_id,
                "new_status": request.status.value,
                "reviewed_by": current_user.get("sub"),
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
    request_id: str,
    current_user: dict = Depends(get_current_user),
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
        is_owner = request.user_id == current_user.get("sub")
        is_admin = current_user.get("role") in ['admin', 'super_admin']
        
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
    request_id: str,
    decision_data: AdminDecisionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to approve/reject scholarship applications
    """
    try:
        # Check admin access
        if current_user.get("role") not in ['admin', 'super_admin']:
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
        
        request.assigned_to = current_user.get("sub")
        request.updated_at = datetime.now()
        
        # Store admin decision in request data
        if not request.request_data:
            request.request_data = {}
        
        request.request_data['admin_decision'] = {
            "decision": decision_data.decision,
            "decided_by": current_user.get("sub"),
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
            performed_by=current_user.get("sub"),
            comments=decision_data.comments or f"Admin {decision_data.decision} decision",
            log_metadata={
                "decision": decision_data.decision,
                "admin_notes": decision_data.admin_notes
            }
        )
        
        db.add(workflow_log)
        await db.commit()
        
        # Send notification to user about decision
        await notification_service.send_scholarship_status_notification(
            db=db,
            user_id=request.user_id,
            request=request,
            status_change=decision_data.decision,
            additional_info={"admin_comments": decision_data.comments}
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Application {decision_data.decision}d successfully",
                "request_id": request_id,
                "new_status": new_status,
                "decision": decision_data.decision,
                "decided_by": current_user.get("sub"),
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error making admin decision: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications")
async def get_user_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get notifications for the current user
    """
    try:
        notifications = await notification_service.get_user_notifications(
            db=db,
            user_id=current_user.get("sub"),
            unread_only=unread_only,
            limit=limit
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "total": len(notifications),
                "notifications": notifications
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a notification as read
    """
    try:
        success = await notification_service.mark_notification_read(
            db=db,
            notification_id=notification_id,
            user_id=current_user.get("sub")
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return JSONResponse(
            status_code=200,
            content={"message": "Notification marked as read"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))
