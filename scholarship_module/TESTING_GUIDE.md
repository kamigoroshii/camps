# 🧪 Scholarship Module Testing Guide

Complete guide to test the scholarship verification module using 6 different methods.

## 📋 Table of Contents

1. [Web Interface Testing](#1-web-interface-testing)
2. [Manual Python Script](#2-manual-python-script)
3. [Automated Tests (pytest)](#3-automated-tests-pytest)
4. [Postman/Insomnia](#4-postmaninsomnia)
5. [cURL Commands](#5-curl-commands)
6. [Browser Console/Fetch API](#6-browser-consolefetch-api)

---

## Prerequisites

✅ Backend server running on `http://localhost:8001`  
✅ Tesseract OCR installed  
✅ Python dependencies installed

### Start the Server

```bash
# Windows
cd scholarship_module
start.bat

# Linux/Mac
cd scholarship_module
chmod +x start.sh
./start.sh
```

---

## 1. Web Interface Testing

**Easiest method - No coding required!**

### Steps:

1. **Open Frontend**
   ```bash
   # Open in default browser
   start frontend/index.html
   
   # Or use Python HTTP server
   cd frontend
   python -m http.server 8080
   # Then open http://localhost:8080
   ```

2. **Test Application Submission**
   - Click "Apply for Scholarship" tab
   - Fill in all fields:
     - Full Name: `John Doe`
     - Student ID: `STU12345`
     - Email: `john@university.edu`
     - Department: `Computer Science`
     - Scholarship Type: `Merit-Based`
     - Amount: `5000`
     - Reason: `Excellent academic performance`
   - Click "Submit Application"
   - Note the **Application ID** (e.g., `1`)

3. **Test Document Upload**
   - Click "Upload Documents" tab
   - Enter your Application ID
   - Select Document Type: `ID Card`
   - Click upload area or drag & drop a file
   - Click "Upload & Verify"
   - View verification results

4. **Test Status Check**
   - Click "Check Status" tab
   - Enter your Application ID
   - Click "Check Status"
   - View complete application details

5. **Test Admin Review**
   - Click "Admin Review" tab
   - Click "Load All Applications"
   - View all applications
   - Click "Load Pending Reviews"
   - Approve/Reject applications

**Expected Results:**
- ✅ Application created with ID
- ✅ Document uploaded and verified
- ✅ OCR confidence scores displayed
- ✅ Verification status updated
- ✅ Admin can review and decide

---

## 2. Manual Python Script

**Best for step-by-step testing**

### Run the Script:

```bash
cd tests
python manual_test.py
```

### What it does:

1. Health check
2. Submit test application
3. Upload test document
4. Run verification
5. Check application status
6. List all applications
7. Optional admin review

### Expected Output:

```
==================================================
  SCHOLARSHIP VERIFICATION MODULE - MANUAL TEST
==================================================

==================================================
  1. Health Check
==================================================

Status: 200
{
  "status": "online",
  "module": "Scholarship Verification",
  "version": "1.0.0"
}

==================================================
  2. Submit Application
==================================================

Submitting application...
{
  "full_name": "Alice Johnson",
  "student_id": "STU67890",
  ...
}

Status: 201
{
  "message": "Application submitted successfully",
  "application_id": 1,
  "status": "pending"
}

... (continues with all tests)
```

---

## 3. Automated Tests (pytest)

**Best for CI/CD and regression testing**

### Setup:

```bash
cd tests
pip install pytest requests pillow
```

### Run Tests:

```bash
# Run all tests
pytest test_api.py -v

# Run specific test
pytest test_api.py::TestScholarshipAPI::test_submit_application -v

# Run with detailed output
pytest test_api.py -v -s
```

### Expected Output:

```
tests/test_api.py::TestScholarshipAPI::test_health_check PASSED
tests/test_api.py::TestScholarshipAPI::test_submit_application PASSED
tests/test_api.py::TestScholarshipAPI::test_upload_document PASSED
tests/test_api.py::TestScholarshipAPI::test_get_application PASSED
tests/test_api.py::TestScholarshipAPI::test_get_all_applications PASSED
tests/test_api.py::TestScholarshipAPI::test_verify_application PASSED
tests/test_api.py::TestScholarshipAPI::test_admin_review PASSED
tests/test_api.py::TestScholarshipAPI::test_pending_reviews PASSED
tests/test_api.py::TestScholarshipAPI::test_invalid_application_id PASSED

========================= 9 passed in 5.23s =========================
```

---

## 4. Postman/Insomnia

**Best for API exploration and documentation**

### Setup:

1. Generate Postman collection:
   ```bash
   cd tests
   python postman_collection.py
   ```

2. Import `scholarship_api.postman_collection.json` into Postman

### Test Flow:

1. **Health Check**
   - GET `http://localhost:8001/`
   - Should return status "online"

2. **Submit Application**
   - POST `http://localhost:8001/api/submit-application`
   - Body: form-data
   - Copy the `application_id` from response

3. **Upload Document**
   - POST `http://localhost:8001/api/upload-document/{{application_id}}`
   - Body: form-data (file + document_type)

4. **Verify Application**
   - POST `http://localhost:8001/api/verify-application/{{application_id}}`

5. **Get Application**
   - GET `http://localhost:8001/api/application/{{application_id}}`

6. **Admin Review**
   - POST `http://localhost:8001/api/admin-review`
   - Body: JSON

### Environment Variables:

```
base_url: http://localhost:8001
application_id: 1
```

---

## 5. cURL Commands

**Best for quick terminal testing**

### Test Sequence:

```bash
# 1. Health Check
curl http://localhost:8001/

# 2. Submit Application
curl -X POST http://localhost:8001/api/submit-application \
  -F "full_name=Test Student" \
  -F "student_id=STU999" \
  -F "email=test@university.edu" \
  -F "department=Computer Science" \
  -F "scholarship_type=Merit-Based" \
  -F "amount_requested=5000" \
  -F "reason=Academic excellence"

# Response will include application_id, use it in next commands

# 3. Upload Document (replace 1 with your application_id)
curl -X POST http://localhost:8001/api/upload-document/1 \
  -F "document_type=ID Card" \
  -F "file=@/path/to/your/document.jpg"

# 4. Verify Application
curl -X POST http://localhost:8001/api/verify-application/1

# 5. Get Application Status
curl http://localhost:8001/api/application/1

# 6. Get All Applications
curl http://localhost:8001/api/applications

# 7. Get Pending Reviews
curl http://localhost:8001/api/applications/pending-review

# 8. Admin Review
curl -X POST http://localhost:8001/api/admin-review \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": 1,
    "decision": "approved",
    "comments": "All requirements met"
  }'
```

### Pretty Print JSON (with jq):

```bash
curl http://localhost:8001/api/application/1 | jq
```

---

## 6. Browser Console/Fetch API

**Best for frontend debugging**

### Open Browser Console (F12) and run:

```javascript
// 1. Submit Application
fetch('http://localhost:8001/api/submit-application', {
  method: 'POST',
  body: new FormData(Object.entries({
    full_name: 'Browser Test',
    student_id: 'STU111',
    email: 'browser@test.com',
    department: 'CS',
    scholarship_type: 'Merit-Based',
    amount_requested: 5000,
    reason: 'Testing from browser'
  }).reduce((fd, [k, v]) => {
    fd.append(k, v);
    return fd;
  }, new FormData()))
})
.then(r => r.json())
.then(console.log)

// 2. Get Application (after getting ID from above)
fetch('http://localhost:8001/api/application/1')
  .then(r => r.json())
  .then(console.log)

// 3. Get All Applications
fetch('http://localhost:8001/api/applications')
  .then(r => r.json())
  .then(data => {
    console.table(data.applications)
  })

// 4. Upload Document
const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.onchange = async (e) => {
  const formData = new FormData()
  formData.append('file', e.target.files[0])
  formData.append('document_type', 'ID Card')
  
  const response = await fetch('http://localhost:8001/api/upload-document/1', {
    method: 'POST',
    body: formData
  })
  
  console.log(await response.json())
}
fileInput.click()
```

---

## 📊 Verification Scenarios

### Scenario 1: High Confidence (Auto-Approved)

**Goal:** Get overall confidence ≥ 85%

**Steps:**
1. Submit application with complete, accurate data
2. Upload high-quality, clear documents
3. Ensure all identity fields match
4. Use recent, valid documents

**Expected Result:**
- Status: `auto_approved`
- Confidence: ≥ 85%
- Decision: "High confidence verification - all checks passed"

### Scenario 2: Medium Confidence (Manual Review)

**Goal:** Get confidence 60-84%

**Steps:**
1. Submit application
2. Upload documents with slight quality issues
3. Minor mismatches in data

**Expected Result:**
- Status: `manual_review`
- Confidence: 60-84%
- Decision: "Medium confidence - requires manual review"

### Scenario 3: Low Confidence (Auto-Rejected)

**Goal:** Get confidence < 60%

**Steps:**
1. Submit application
2. Upload very poor quality or blank images
3. Major data mismatches

**Expected Result:**
- Status: `auto_rejected`
- Confidence: < 60%
- Decision: "Low confidence - verification failed"

---

## 🐛 Troubleshooting

### Issue: Connection Refused

**Solution:**
```bash
# Check if server is running
curl http://localhost:8001/
```

### Issue: OCR Not Working

**Solution:**
```bash
# Verify Tesseract installation
tesseract --version

# Check path in backend/main.py line 17
```

### Issue: CORS Error in Browser

**Solution:**
- Ensure backend is running
- Check CORS middleware in backend/main.py
- Use same origin or proper CORS headers

### Issue: File Upload Fails

**Solution:**
- Check file size (< 10MB)
- Verify file format (JPG, PNG, PDF)
- Ensure document_type is selected

---

## ✅ Test Checklist

Use this to verify all functionality:

- [ ] Backend starts successfully
- [ ] Health check returns 200
- [ ] Application submission works
- [ ] Application ID is returned
- [ ] Document upload succeeds
- [ ] OCR extracts text
- [ ] Verification runs without errors
- [ ] Confidence scores are calculated
- [ ] Decision is made (approved/review/rejected)
- [ ] Status check returns correct data
- [ ] All applications can be listed
- [ ] Pending reviews can be filtered
- [ ] Admin can approve/reject
- [ ] Frontend loads properly
- [ ] Frontend tabs work
- [ ] Form validation works
- [ ] File upload UI works
- [ ] Results are displayed correctly

---

## 📈 Performance Testing

### Load Test with Apache Bench:

```bash
# Install Apache Bench
# Windows: Download from Apache website
# Linux: sudo apt install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 http://localhost:8001/

# Test application submission
ab -n 100 -c 5 -p application.json -T application/json \
   http://localhost:8001/api/submit-application
```

### Load Test with Python:

```python
import concurrent.futures
import requests

def submit_application(i):
    data = {
        'full_name': f'Test Student {i}',
        'student_id': f'STU{i:05d}',
        'email': f'test{i}@university.edu',
        'department': 'CS',
        'scholarship_type': 'Merit-Based',
        'amount_requested': 5000,
        'reason': 'Testing'
    }
    return requests.post('http://localhost:8001/api/submit-application', data=data)

# Submit 100 applications concurrently
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(submit_application, range(100)))

print(f"Success: {sum(1 for r in results if r.status_code == 201)}/100")
```

---

## 📝 Test Report Template

Use this template to document your testing:

```markdown
# Test Report - Scholarship Verification Module

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** Local/Staging/Production

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

## Detailed Results

### 1. Application Submission
- Status: ✅ Pass / ❌ Fail
- Notes: ...

### 2. Document Upload
- Status: ✅ Pass / ❌ Fail
- Notes: ...

### 3. Verification Process
- Status: ✅ Pass / ❌ Fail
- Notes: ...

### 4. Admin Review
- Status: ✅ Pass / ❌ Fail
- Notes: ...

## Issues Found
1. Issue description
   - Severity: High/Medium/Low
   - Steps to reproduce: ...
   - Expected result: ...
   - Actual result: ...

## Recommendations
- ...
```

---

**Ready to test?** Pick your preferred method and start testing! 🚀
