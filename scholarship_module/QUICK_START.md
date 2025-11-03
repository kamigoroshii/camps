# 🚀 Quick Start - Scholarship Verification

## ⚡ 3-Step Quick Start

### 1️⃣ Start Backend
```bash
cd scholarship_module
start.bat  # Windows
./start.sh # Linux/Mac
```

### 2️⃣ Open Frontend
```bash
# Just open in browser
start frontend\index.html
```

### 3️⃣ Test the System
- Click "Apply for Scholarship"
- Fill form and submit
- Upload documents
- Check verification status

**That's it!** ✨

---

## 📍 Quick Access

| What | URL/Location |
|------|--------------|
| **Backend API** | http://localhost:8001 |
| **API Docs** | http://localhost:8001/docs |
| **Frontend** | `scholarship_module/frontend/index.html` |
| **Main App (Student)** | `/scholarship-verification` |
| **Main App (Admin)** | `/admin/scholarship-review` |

---

## 🧪 Quick Test Commands

### Test with cURL
```bash
# Health check
curl http://localhost:8001/

# Submit application
curl -X POST http://localhost:8001/api/submit-application \
  -F "full_name=Test User" \
  -F "student_id=STU123" \
  -F "email=test@edu.com" \
  -F "department=CS" \
  -F "scholarship_type=Merit-Based" \
  -F "amount_requested=5000" \
  -F "reason=Testing"
```

### Test with Python
```bash
cd scholarship_module/tests
python manual_test.py
```

### Test with pytest
```bash
cd scholarship_module/tests
pytest test_api.py -v
```

---

## 📊 API Endpoints Cheat Sheet

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/api/submit-application` | Submit new application |
| **POST** | `/api/upload-document/{id}` | Upload & verify document |
| **POST** | `/api/verify-application/{id}` | Run full verification |
| **GET** | `/api/application/{id}` | Get application status |
| **GET** | `/api/applications` | List all applications |
| **GET** | `/api/applications/pending-review` | Get pending reviews |
| **POST** | `/api/admin-review` | Submit admin decision |

---

## 🎯 Verification Thresholds

| Confidence | Decision | Action |
|-----------|----------|--------|
| **≥ 85%** | ✅ Auto-Approved | No action needed |
| **60-84%** | ⚠️ Manual Review | Admin reviews |
| **< 60%** | ❌ Auto-Rejected | Resubmit required |

---

## 📁 File Structure

```
scholarship_module/
├── backend/
│   ├── main.py           ← Backend server
│   └── requirements.txt  ← Dependencies
├── frontend/
│   └── index.html        ← Web interface
├── tests/
│   ├── test_api.py       ← Automated tests
│   ├── manual_test.py    ← Manual testing
│   └── postman_collection.py
├── README.md             ← Full documentation
├── TESTING_GUIDE.md      ← Testing guide
└── start.bat/start.sh    ← Start scripts
```

---

## 🔧 Configuration

### Tesseract Path
File: `backend/main.py` (line 17)
```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

### Backend Port
File: `backend/main.py` (last line)
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Frontend API URL
File: `frontend/index.html` (line 370)
```javascript
const API_BASE = 'http://localhost:8001/api';
```

---

## ✅ Pre-flight Checklist

Before running:
- [ ] Python 3.8+ installed
- [ ] Tesseract OCR installed
- [ ] Port 8001 available
- [ ] Dependencies installed

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Server won't start** | Check port 8001, install dependencies |
| **OCR fails** | Verify Tesseract installation and path |
| **CORS errors** | Ensure backend is running |
| **Upload fails** | Check file size (<10MB) and format |

---

## 📞 Help

- **Full Guide**: `README.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Summary**: `SCHOLARSHIP_MODULE_SUMMARY.md`

---

**Need help?** All documentation is in the `scholarship_module/` directory! 📚
