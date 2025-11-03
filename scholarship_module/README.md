# 🎓 Scholarship Verification Module - Standalone

A complete, standalone scholarship verification system with automated document processing, OCR, and AI-powered verification.

## 📁 Project Structure

```
scholarship_module/
├── backend/
│   ├── main.py                 # FastAPI standalone server
│   └── requirements.txt        # Python dependencies
├── frontend/
│   └── index.html             # Complete web interface
├── tests/
│   ├── test_api.py            # Automated tests (pytest)
│   ├── manual_test.py         # Manual test script
│   └── postman_collection.py  # Postman collection generator
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd scholarship_module/backend

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Server will start on: **http://localhost:8001**

### 2. Frontend Setup

Simply open the frontend HTML file in your browser:

```bash
# Option 1: Open directly
start frontend/index.html

# Option 2: Use Python HTTP server
cd frontend
python -m http.server 8080
# Then open http://localhost:8080
```

## ✅ Testing Methods

### Method 1: Web Interface (Easiest)

1. Open `frontend/index.html` in your browser
2. Use the tabs to:
   - **Apply**: Submit a new scholarship application
   - **Upload**: Upload documents for verification
   - **Status**: Check application status
   - **Admin**: Review and approve/reject applications

### Method 2: Manual Test Script

```bash
cd tests
python manual_test.py
```

This script will:
- Submit a test application
- Upload a document
- Run verification
- Display results
- Optionally test admin review

### Method 3: Automated Tests (pytest)

```bash
cd tests
pip install pytest requests pillow
pytest test_api.py -v
```

### Method 4: Postman Collection

```bash
cd tests
python postman_collection.py
```

This creates a Postman collection file. Import it into Postman and run all endpoints.

### Method 5: cURL Commands

```bash
# 1. Health Check
curl http://localhost:8001/

# 2. Submit Application
curl -X POST http://localhost:8001/api/submit-application \
  -F "full_name=John Doe" \
  -F "student_id=STU12345" \
  -F "email=john@university.edu" \
  -F "department=CS" \
  -F "scholarship_type=Merit-Based" \
  -F "amount_requested=5000" \
  -F "reason=Academic excellence"

# 3. Upload Document (replace {app_id} with actual ID)
curl -X POST http://localhost:8001/api/upload-document/1 \
  -F "document_type=ID Card" \
  -F "file=@/path/to/document.jpg"

# 4. Verify Application
curl -X POST http://localhost:8001/api/verify-application/1

# 5. Get Application Status
curl http://localhost:8001/api/application/1

# 6. Get All Applications
curl http://localhost:8001/api/applications

# 7. Admin Review
curl -X POST http://localhost:8001/api/admin-review \
  -H "Content-Type: application/json" \
  -d '{"application_id": 1, "decision": "approved", "comments": "Approved"}'
```

### Method 6: Python Requests

```python
import requests

# Submit application
response = requests.post('http://localhost:8001/api/submit-application', data={
    'full_name': 'Jane Smith',
    'student_id': 'STU999',
    'email': 'jane@university.edu',
    'department': 'Engineering',
    'scholarship_type': 'Need-Based',
    'amount_requested': 7500,
    'reason': 'Financial need'
})
print(response.json())
```

## 📡 API Endpoints

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/submit-application` | Submit new application |
| POST | `/api/upload-document/{app_id}` | Upload & verify document |
| POST | `/api/verify-application/{app_id}` | Run full verification |
| GET | `/api/application/{app_id}` | Get application status |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get all applications |
| GET | `/api/applications/pending-review` | Get pending reviews |
| POST | `/api/admin-review` | Submit admin decision |

## 🎯 Features

### Automated Verification
- ✅ OCR text extraction (Tesseract)
- ✅ Identity verification
- ✅ Document authenticity checks
- ✅ Data validation
- ✅ Fraud detection
- ✅ Auto-approval/rejection based on confidence scores

### Verification Thresholds
- **≥85% confidence** → Auto-approved
- **60-84% confidence** → Manual review required
- **<60% confidence** → Auto-rejected

### Document Types Supported
- ID Cards
- Income Certificates
- Academic Transcripts/Marksheets
- Bank Statements
- Caste Certificates
- Other supporting documents

### Supported File Formats
- Images: JPG, JPEG, PNG
- Documents: PDF (requires pdf2image and poppler)

## 🔧 Configuration

### Tesseract OCR Path

The backend is configured to use Tesseract at:
```python
C:\Program Files\Tesseract-OCR\tesseract.exe
```

If your Tesseract is installed elsewhere, update line 17 in `backend/main.py`.

### Port Configuration

Default ports:
- **Backend**: 8001
- **Frontend**: Any (open HTML directly or use 8080 with Python server)

To change backend port, edit the last line in `backend/main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=YOUR_PORT)
```

## 📊 Workflow

```
1. Student submits application
   ↓
2. System generates application ID
   ↓
3. Student uploads documents
   ↓
4. OCR extracts text from documents
   ↓
5. System runs verification checks:
   - Identity verification
   - Authenticity check
   - Data validation
   ↓
6. System calculates confidence scores
   ↓
7. Auto-decision made:
   - High confidence → Auto-approved
   - Medium confidence → Manual review
   - Low confidence → Auto-rejected
   ↓
8. Admin reviews (if needed)
   ↓
9. Final decision communicated
```

## 🧪 Sample Test Flow

### Using Web Interface:

1. **Apply Tab**:
   - Fill in: Name, ID, Email, Department
   - Select scholarship type
   - Enter amount and reason
   - Click "Submit Application"
   - Note the Application ID

2. **Upload Tab**:
   - Enter Application ID
   - Select document type
   - Upload a document (image/PDF)
   - Click "Upload & Verify"
   - See verification results

3. **Status Tab**:
   - Enter Application ID
   - Click "Check Status"
   - View complete verification report

4. **Admin Tab**:
   - Click "Load Pending Reviews"
   - Review flagged applications
   - Approve or reject with comments

## 📝 Response Examples

### Submit Application Response
```json
{
  "message": "Application submitted successfully",
  "application_id": 1,
  "status": "pending",
  "next_steps": "Please upload required documents for verification"
}
```

### Verification Response
```json
{
  "message": "Verification completed",
  "application_id": 1,
  "status": "auto_approved",
  "confidence": 0.92,
  "report": {
    "overall_confidence": 0.92,
    "identity_score": 0.95,
    "authenticity_score": 0.90,
    "data_validity_score": 0.91,
    "decision": "auto_approved",
    "decision_reason": "High confidence verification - all checks passed",
    "documents_verified": 3
  }
}
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8001 is available
- Verify Python 3.8+ is installed
- Install all requirements: `pip install -r requirements.txt`

### OCR not working
- Ensure Tesseract is installed
- Verify Tesseract path in `main.py`
- Check if image quality is sufficient

### CORS errors in browser
- Make sure backend is running
- Check API_BASE URL in `index.html` (line 370)

### Document upload fails
- Check file size (max 10MB)
- Verify file format (JPG, PNG, PDF)
- Ensure document type is selected

## 🔐 Security Notes

**For Production Deployment:**

1. Add authentication/authorization
2. Restrict CORS origins
3. Add rate limiting
4. Use HTTPS
5. Implement file size limits
6. Add virus scanning for uploads
7. Use database instead of in-memory storage
8. Add input validation and sanitization
9. Implement proper session management
10. Add logging and monitoring

## 📚 Dependencies

### Backend
- FastAPI - Web framework
- uvicorn - ASGI server
- pytesseract - OCR
- opencv-python - Image processing
- Pillow - Image handling
- numpy - Numerical operations
- PyPDF2 - PDF processing
- python-docx - Word document processing
- pandas - Data manipulation
- rapidfuzz - String matching

### Frontend
- Pure HTML/CSS/JavaScript
- No build tools required
- Works in any modern browser

## 🎨 Customization

### Add New Document Type
1. Update `DOCUMENT_TYPES` in frontend HTML
2. Add verification logic in backend if needed

### Change Confidence Thresholds
Edit lines 233-241 in `backend/main.py`:
```python
if overall_confidence >= 0.85:  # Change this
    decision = "auto_approved"
elif overall_confidence >= 0.60:  # And this
    decision = "manual_review"
```

### Add New Verification Checks
Extend the verification logic in `upload_document()` function.

## 📞 Support

For issues or questions:
1. Check this README
2. Review the test files for examples
3. Check backend logs for errors
4. Verify Tesseract installation

## 📄 License

This module is part of the CAMPS project.

---

**Ready to test?** Start the backend with `python backend/main.py` and open `frontend/index.html`! 🚀
