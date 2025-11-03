# Admin Scholarship Review - Testing & Setup Guide

## Overview
This document provides instructions for testing the Admin Scholarship Review functionality.

## What Was Implemented

### 1. **Admin Review Page** (`AdminScholarshipReviewPage.tsx`)
- Complete rewrite with modern Material-UI interface
- Features:
  - Application list table with filtering
  - Details dialog showing:
    - Applicant information
    - Verification scores with color-coded progress bars
    - Document list with OCR text previews
    - Document viewing capability
  - Review dialog with:
    - Approve/Reject/Request More Info options
    - Review notes field
    - Confirmation alerts
  - Refresh functionality
  - Loading states and error handling

### 2. **Backend Endpoints** (Already existing in `scholarship_verification_simple.py`)
- `GET /api/v1/scholarship-verification/admin/pending` - List pending applications
- `GET /api/v1/scholarship-verification/verification-details/{request_id}` - Get verification details
- `POST /api/v1/scholarship-verification/admin/review/{request_id}` - Submit review
- `GET /api/v1/scholarship-verification/document/{document_id}` - View document

### 3. **Test Script** (`test_admin_review.py`)
Comprehensive test script that verifies:
- Backend health check
- Admin authentication
- Fetching pending applications
- Getting verification details
- Document retrieval
- Review submission (optional)

## Setup Instructions

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. MongoDB running with user data
3. At least one scholarship application submitted

### Step 1: Create/Update Admin User

Run the user management script:
```bash
cd f:\camps\backend
python update_admin_user.py
```

This will:
1. List all users in MongoDB
2. Allow you to select a user
3. Update the role to 'admin'
4. Set password to 'admin123'
5. Activate the account

### Step 2: Run the Test Script

```bash
cd f:\camps\backend
python test_admin_review.py
```

The script will:
1. ✓ Check backend health
2. ✓ Attempt admin login (with multiple credential options)
3. ✓ Fetch pending scholarship applications
4. ✓ Get verification details for the first application
5. ✓ Test document retrieval
6. ⚠ Skip review submission (to preserve data)

### Step 3: Test in Browser

1. Start the frontend:
   ```bash
   cd f:\camps\frontend
   npm run dev
   ```

2. Login as admin at `http://localhost:5173/login`
   - Username/Email: (your admin username)
   - Password: admin123

3. Navigate to **Admin → Scholarship Review** from the sidebar

4. Test the following:
   - [ ] View applications list
   - [ ] Click "View Details" icon (eye icon)
   - [ ] Check verification scores display
   - [ ] Preview OCR text in documents
   - [ ] Click "Review" icon (Assessment icon)
   - [ ] Select decision (Approve/Reject/Request More Info)
   - [ ] Add review notes
   - [ ] Submit review
   - [ ] Verify success message
   - [ ] Check application list refreshes

## Expected Results

### Test Script Output

```
============================================================
ADMIN SCHOLARSHIP REVIEW - TEST SUITE
============================================================

ℹ Checking backend health...
✓ Backend is healthy
ℹ Database: mongodb
ℹ Users count: 2

ℹ Attempting admin login...
ℹ   Try 1: admin@camps.edu
✓ Admin login successful as admin
ℹ Role: admin, Status: active

ℹ Testing: Get Pending Applications
✓ Successfully fetched pending applications
ℹ Found 5 pending application(s)

ℹ Sample application data:
  - Application #: SCH-20241104-XXXX
  - Applicant: John Doe
  - Status: submitted
  - Documents: 5
  - Submitted: 2024-11-04T10:30:00

ℹ Testing: Get Verification Details for xxx-xxx-xxx
✓ Successfully fetched verification details
ℹ Application #: SCH-20241104-XXXX
ℹ Status: submitted
ℹ Overall Score: 14.2%
ℹ Documents: 5

  Document 1:
    - Type: id_proof
    - Filename: id_card.pdf
    - Verified: False
    - OCR Text Preview: [Page 1] ID Proof This is a placeholder...

  Verification Results:
    id_proof:
      - Identity Confidence: 0.2
      - Authenticity Confidence: 0.5
      - Overall Confidence: 0.35

ℹ Testing: Get Document xxx-xxx-xxx
✓ Document retrieved successfully
ℹ Content-Type: application/pdf
ℹ Content-Length: 15234 bytes

⚠ Skipping actual review submission to preserve data

============================================================
TEST SUMMARY
============================================================

✓ Passed: 5/5
✗ Failed: 0/5
⚠ Warnings: 1

✓ All tests passed! ✓
```

## Troubleshooting

### Issue: "Login failed: 401"
**Solution**: 
- Run `python update_admin_user.py` to set up admin user
- Verify user has `role: 'admin'` and `status: 'active'` in MongoDB

### Issue: "No pending applications found"
**Solution**: 
- Create a scholarship application first
- Go to Student portal → Scholarships → Apply
- Upload required documents

### Issue: "Cannot connect to backend"
**Solution**:
- Verify backend is running: `http://localhost:8000/docs`
- Check MongoDB is running
- Review backend logs for errors

### Issue: "OCR text not showing"
**Solution**:
- Verify Tesseract is installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`
- Check backend logs for OCR errors
- Ensure documents were uploaded AFTER OCR integration

## API Endpoints Reference

### Get Pending Applications
```http
GET /api/v1/scholarship-verification/admin/pending
Authorization: Bearer {token}
```

**Response:**
```json
{
  "applications": [
    {
      "request_id": "uuid",
      "application_number": "SCH-20241104-XXXX",
      "status": "submitted",
      "submitted_date": "2024-11-04T10:30:00",
      "data": {
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "course": "Computer Science",
        "year_of_study": "3",
        "reason": "Financial need"
      },
      "documents_count": 5
    }
  ]
}
```

### Get Verification Details
```http
GET /api/v1/scholarship-verification/verification-details/{request_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "request_id": "uuid",
  "application_number": "SCH-20241104-XXXX",
  "overall_score": 0.142,
  "status": "submitted",
  "documents": [
    {
      "id": "doc-uuid",
      "type": "id_proof",
      "filename": "id_card.pdf",
      "is_verified": false,
      "ocr_text": "Extracted text from document...",
      "uploaded_at": "2024-11-04T10:30:00"
    }
  ],
  "verification_results": {
    "id_proof": {
      "identity_confidence": 0.2,
      "authenticity_confidence": 0.5,
      "overall_confidence": 0.35
    }
  }
}
```

### Submit Review
```http
POST /api/v1/scholarship-verification/admin/review/{request_id}
Authorization: Bearer {token}
Content-Type: multipart/form-data

status=approved&notes=All documents verified
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "application_number": "SCH-20241104-XXXX",
  "new_status": "approved"
}
```

## Files Modified/Created

1. **Frontend:**
   - `frontend/src/pages/AdminScholarshipReviewPage.tsx` - Complete rewrite (642 lines)

2. **Backend:**
   - `backend/test_admin_review.py` - New comprehensive test script
   - `backend/update_admin_user.py` - User management utility

3. **Documentation:**
   - `ADMIN_REVIEW_TESTING_GUIDE.md` - This file

## Next Steps

After verifying the admin review functionality works:

1. **Status Tracking System**
   - Implement status change notifications
   - Add email alerts for applicants
   - Create in-app notification system

2. **Verification Reports**
   - Generate PDF reports with verification details
   - Include OCR analysis summary
   - Add recommendations for approval/rejection

3. **Admin Dashboard Updates**
   - Add statistics on pending reviews
   - Show average verification scores
   - Display processing times

4. **Testing**
   - End-to-end testing of review workflow
   - Test with various document types
   - Verify notification delivery

## Support

If you encounter issues:
1. Check backend logs: `f:\camps\backend\` (uvicorn terminal)
2. Check frontend console: Browser DevTools
3. Verify MongoDB connection and data
4. Review this guide's troubleshooting section
