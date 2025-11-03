"""
Standalone Scholarship Verification Module - FastAPI Backend
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import sys
import os

# Add parent directory to path to import scholarship service
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from app.services.scholarship_verification import ScholarshipVerificationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Scholarship Verification Module",
    description="Standalone module for automated scholarship document verification",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize verification service
verification_service = ScholarshipVerificationService()

# In-memory storage for demo (use database in production)
applications_db = {}
application_counter = 1


# ==================== MODELS ====================

class ApplicationSubmission(BaseModel):
    full_name: str
    student_id: str
    email: str
    department: str
    scholarship_type: str
    amount_requested: float
    reason: str


class VerificationResult(BaseModel):
    application_id: int
    status: str
    confidence: float
    verification_details: Dict[str, Any]
    decision: Dict[str, Any]
    report: Dict[str, Any]


class AdminReview(BaseModel):
    application_id: int
    decision: str  # "approved" or "rejected"
    comments: str


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "module": "Scholarship Verification",
        "version": "1.0.0"
    }


@app.post("/api/submit-application")
async def submit_application(
    full_name: str = Form(...),
    student_id: str = Form(...),
    email: str = Form(...),
    department: str = Form(...),
    scholarship_type: str = Form(...),
    amount_requested: float = Form(...),
    reason: str = Form(...)
):
    """
    Submit a new scholarship application
    """
    global application_counter
    
    try:
        application_id = application_counter
        application_counter += 1
        
        # Store application
        applications_db[application_id] = {
            "id": application_id,
            "full_name": full_name,
            "student_id": student_id,
            "email": email,
            "department": department,
            "scholarship_type": scholarship_type,
            "amount_requested": amount_requested,
            "reason": reason,
            "status": "pending",
            "documents": [],
            "verification_results": None,
            "created_at": "2024-01-01"  # Use datetime in production
        }
        
        logger.info(f"Application submitted: ID {application_id}")
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "Application submitted successfully",
                "application_id": application_id,
                "status": "pending",
                "next_steps": "Please upload required documents for verification"
            }
        )
        
    except Exception as e:
        logger.error(f"Error submitting application: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-document/{application_id}")
async def upload_document(
    application_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload and verify a document for an application
    """
    try:
        # Check if application exists
        if application_id not in applications_db:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = applications_db[application_id]
        
        # Read file content
        file_content = await file.read()
        file_extension = '.' + file.filename.rsplit('.', 1)[-1].lower()
        
        logger.info(f"Processing document: {file.filename} for application {application_id}")
        
        # Extract text with OCR
        extracted_data = await verification_service.extract_text_with_ocr(
            file_content, file_extension
        )
        
        # Get user data for verification
        user_data = {
            'full_name': application['full_name'],
            'student_id': application['student_id'],
            'department': application['department'],
            'email': application['email']
        }
        
        # Run identity verification
        identity_result = await verification_service.verify_identity(
            extracted_data, user_data
        )
        
        # Run authenticity check
        authenticity_result = await verification_service.verify_document_authenticity(
            file_content, file_extension, extracted_data
        )
        
        # Run data validation
        data_validation_result = await verification_service.verify_data_validity(
            extracted_data, {}
        )
        
        # Store document info
        document_info = {
            "filename": file.filename,
            "document_type": document_type,
            "extraction": {
                "method": extracted_data.get('method'),
                "confidence": extracted_data.get('confidence'),
                "text_length": len(extracted_data.get('text', '')),
                "structured_data": extracted_data.get('structured_data', {})
            },
            "verification": {
                "identity": identity_result,
                "authenticity": authenticity_result,
                "data_validity": data_validation_result
            }
        }
        
        application['documents'].append(document_info)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and verified",
                "application_id": application_id,
                "document": document_info
            }
        )
        
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/verify-application/{application_id}")
async def verify_application(application_id: int):
    """
    Run comprehensive verification on an application
    """
    try:
        # Check if application exists
        if application_id not in applications_db:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = applications_db[application_id]
        
        if not application['documents']:
            raise HTTPException(
                status_code=400,
                detail="No documents uploaded for verification"
            )
        
        logger.info(f"Running comprehensive verification for application {application_id}")
        
        # Aggregate all verification results
        all_identity_checks = []
        all_authenticity_checks = []
        all_data_checks = []
        
        for doc in application['documents']:
            verification = doc['verification']
            all_identity_checks.append(verification['identity'])
            all_authenticity_checks.append(verification['authenticity'])
            all_data_checks.append(verification['data_validity'])
        
        # Calculate overall scores
        identity_score = sum(c['confidence'] for c in all_identity_checks) / len(all_identity_checks)
        authenticity_score = sum(c['confidence'] for c in all_authenticity_checks) / len(all_authenticity_checks)
        data_score = sum(c['confidence'] for c in all_data_checks) / len(all_data_checks)
        
        overall_confidence = (identity_score + authenticity_score + data_score) / 3
        
        # Make decision
        if overall_confidence >= 0.85:
            decision = "auto_approved"
            decision_reason = "High confidence verification - all checks passed"
        elif overall_confidence >= 0.60:
            decision = "manual_review"
            decision_reason = "Medium confidence - requires manual review"
        else:
            decision = "auto_rejected"
            decision_reason = "Low confidence - verification failed"
        
        # Generate report
        report = {
            "overall_confidence": overall_confidence,
            "identity_score": identity_score,
            "authenticity_score": authenticity_score,
            "data_validity_score": data_score,
            "decision": decision,
            "decision_reason": decision_reason,
            "documents_verified": len(application['documents']),
            "issues_found": [],
            "recommendations": []
        }
        
        # Update application
        application['status'] = decision
        application['verification_results'] = report
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Verification completed",
                "application_id": application_id,
                "status": decision,
                "confidence": overall_confidence,
                "report": report
            }
        )
        
    except Exception as e:
        logger.error(f"Error verifying application: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/application/{application_id}")
async def get_application(application_id: int):
    """
    Get application details and status
    """
    try:
        if application_id not in applications_db:
            raise HTTPException(status_code=404, detail="Application not found")
        
        return JSONResponse(
            status_code=200,
            content=applications_db[application_id]
        )
        
    except Exception as e:
        logger.error(f"Error getting application: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/applications")
async def get_all_applications():
    """
    Get all applications (for admin)
    """
    try:
        return JSONResponse(
            status_code=200,
            content={"applications": list(applications_db.values())}
        )
        
    except Exception as e:
        logger.error(f"Error getting applications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/applications/pending-review")
async def get_pending_reviews():
    """
    Get applications pending manual review
    """
    try:
        pending = [
            app for app in applications_db.values()
            if app['status'] == 'manual_review'
        ]
        
        return JSONResponse(
            status_code=200,
            content={"applications": pending}
        )
        
    except Exception as e:
        logger.error(f"Error getting pending reviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin-review")
async def submit_admin_review(review: AdminReview):
    """
    Admin manual review decision
    """
    try:
        application_id = review.application_id
        
        if application_id not in applications_db:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = applications_db[application_id]
        
        # Update application status
        application['status'] = review.decision
        application['admin_comments'] = review.comments
        
        logger.info(f"Admin review submitted for application {application_id}: {review.decision}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Review submitted successfully",
                "application_id": application_id,
                "decision": review.decision
            }
        )
        
    except Exception as e:
        logger.error(f"Error submitting review: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
