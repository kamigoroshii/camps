"""
Test suite for Scholarship Verification Module
Run with: pytest test_api.py -v
"""

import pytest
import requests
import os
from io import BytesIO

API_BASE = "http://localhost:8001/api"

class TestScholarshipAPI:
    
    def test_health_check(self):
        """Test if API is running"""
        response = requests.get("http://localhost:8001/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["module"] == "Scholarship Verification"
    
    def test_submit_application(self):
        """Test application submission"""
        payload = {
            "full_name": "John Doe",
            "student_id": "STU12345",
            "email": "john.doe@university.edu",
            "department": "Computer Science",
            "scholarship_type": "Merit-Based",
            "amount_requested": 5000.00,
            "reason": "Excellent academic performance"
        }
        
        response = requests.post(f"{API_BASE}/submit-application", data=payload)
        assert response.status_code == 201
        data = response.json()
        assert "application_id" in data
        assert data["status"] == "pending"
        return data["application_id"]
    
    def test_upload_document(self):
        """Test document upload and verification"""
        # First submit an application
        app_id = self.test_submit_application()
        
        # Create a dummy image file
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='white')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'file': ('test_document.jpg', img_bytes, 'image/jpeg')}
        data = {'document_type': 'ID Card'}
        
        response = requests.post(
            f"{API_BASE}/upload-document/{app_id}",
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "document" in result
        assert result["document"]["document_type"] == "ID Card"
    
    def test_get_application(self):
        """Test retrieving application details"""
        app_id = self.test_submit_application()
        
        response = requests.get(f"{API_BASE}/application/{app_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == app_id
        assert "full_name" in data
        assert "status" in data
    
    def test_get_all_applications(self):
        """Test retrieving all applications"""
        response = requests.get(f"{API_BASE}/applications")
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        assert isinstance(data["applications"], list)
    
    def test_verify_application(self):
        """Test full application verification"""
        app_id = self.test_submit_application()
        
        # Upload a document first
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='white')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'file': ('test_document.jpg', img_bytes, 'image/jpeg')}
        data = {'document_type': 'ID Card'}
        
        requests.post(
            f"{API_BASE}/upload-document/{app_id}",
            files=files,
            data=data
        )
        
        # Now verify the application
        response = requests.post(f"{API_BASE}/verify-application/{app_id}")
        assert response.status_code == 200
        result = response.json()
        assert "confidence" in result
        assert "status" in result
        assert "report" in result
    
    def test_admin_review(self):
        """Test admin review submission"""
        app_id = self.test_submit_application()
        
        payload = {
            "application_id": app_id,
            "decision": "approved",
            "comments": "All documents verified and approved"
        }
        
        response = requests.post(f"{API_BASE}/admin-review", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "approved"
    
    def test_pending_reviews(self):
        """Test retrieving pending reviews"""
        response = requests.get(f"{API_BASE}/applications/pending-review")
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        assert isinstance(data["applications"], list)
    
    def test_invalid_application_id(self):
        """Test handling of invalid application ID"""
        response = requests.get(f"{API_BASE}/application/99999")
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
