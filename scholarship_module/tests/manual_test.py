"""
Manual testing script for Scholarship Verification Module
Run with: python manual_test.py
"""

import requests
import json
from pathlib import Path

API_BASE = "http://localhost:8001/api"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")

def test_health_check():
    print_section("1. Health Check")
    response = requests.get("http://localhost:8001/")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_submit_application():
    print_section("2. Submit Application")
    
    payload = {
        "full_name": "Alice Johnson",
        "student_id": "STU67890",
        "email": "alice.johnson@university.edu",
        "department": "Engineering",
        "scholarship_type": "Need-Based",
        "amount_requested": 7500.00,
        "reason": "Financial need due to family circumstances"
    }
    
    print("Submitting application...")
    print(json.dumps(payload, indent=2))
    
    response = requests.post(f"{API_BASE}/submit-application", data=payload)
    print(f"\nStatus: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 201:
        return response.json()["application_id"]
    return None

def test_upload_document(app_id):
    print_section("3. Upload Document")
    
    # Create a test image
    from PIL import Image, ImageDraw, ImageFont
    
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Add some text to simulate a document
    text = f"""
    STUDENT ID CARD
    
    Name: Alice Johnson
    Student ID: STU67890
    Department: Engineering
    Valid Until: 2025-12-31
    """
    
    draw.text((50, 50), text, fill='black')
    
    # Save to bytes
    from io import BytesIO
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    files = {'file': ('student_id.jpg', img_bytes, 'image/jpeg')}
    data = {'document_type': 'ID Card'}
    
    print(f"Uploading document for application #{app_id}...")
    response = requests.post(
        f"{API_BASE}/upload-document/{app_id}",
        files=files,
        data=data
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    return response.status_code == 200

def test_verify_application(app_id):
    print_section("4. Verify Application")
    
    print(f"Running verification for application #{app_id}...")
    response = requests.post(f"{API_BASE}/verify-application/{app_id}")
    
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    return response.status_code == 200

def test_get_application(app_id):
    print_section("5. Get Application Status")
    
    print(f"Fetching application #{app_id}...")
    response = requests.get(f"{API_BASE}/application/{app_id}")
    
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    return response.status_code == 200

def test_get_all_applications():
    print_section("6. Get All Applications")
    
    print("Fetching all applications...")
    response = requests.get(f"{API_BASE}/applications")
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total applications: {len(data['applications'])}")
    
    for app in data['applications']:
        print(f"\n  App #{app['id']}: {app['full_name']} - Status: {app['status']}")
    
    return response.status_code == 200

def test_admin_review(app_id):
    print_section("7. Admin Review")
    
    decision = input(f"\nReview application #{app_id} - Approve or Reject? (approve/reject): ").lower()
    comments = input("Enter comments: ")
    
    payload = {
        "application_id": app_id,
        "decision": decision,
        "comments": comments
    }
    
    response = requests.post(f"{API_BASE}/admin-review", json=payload)
    
    print(f"\nStatus: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    return response.status_code == 200

def run_full_test():
    """Run complete test workflow"""
    print("\n" + "🎓"*30)
    print("  SCHOLARSHIP VERIFICATION MODULE - MANUAL TEST")
    print("🎓"*30)
    
    try:
        # Test 1: Health check
        if not test_health_check():
            print("❌ Health check failed! Is the server running?")
            return
        
        # Test 2: Submit application
        app_id = test_submit_application()
        if not app_id:
            print("❌ Application submission failed!")
            return
        
        # Test 3: Upload document
        if not test_upload_document(app_id):
            print("❌ Document upload failed!")
            return
        
        # Test 4: Verify application
        if not test_verify_application(app_id):
            print("❌ Verification failed!")
            return
        
        # Test 5: Get application status
        if not test_get_application(app_id):
            print("❌ Get application failed!")
            return
        
        # Test 6: Get all applications
        test_get_all_applications()
        
        # Test 7: Admin review (optional)
        do_review = input("\n\nDo you want to test admin review? (y/n): ").lower()
        if do_review == 'y':
            test_admin_review(app_id)
        
        print_section("✅ ALL TESTS COMPLETED SUCCESSFULLY")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API server!")
        print("Make sure the server is running on http://localhost:8001")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    run_full_test()
