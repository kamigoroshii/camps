"""
Test script to verify OCR is working by uploading a test document
"""
import requests
import os

# This assumes you have a valid auth token
# You'll need to replace this with your actual token
TOKEN = "your_token_here"  # Get from browser devtools

API_BASE = "http://localhost:8000/api/v1"

def test_ocr():
    print("=" * 80)
    print("OCR FUNCTIONALITY TEST")
    print("=" * 80)
    
    # First, check if we can create a test application
    print("\n1. Creating test application...")
    
    app_data = {
        "full_name": "OCR Test User",
        "email": "ocrtest@example.com", 
        "phone": "1234567890",
        "course": "Test Course",
        "year_of_study": "1st Year",
        "reason": "Testing OCR functionality"
    }
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.post(
            f"{API_BASE}/scholarship-verification/submit",
            json=app_data,
            headers=headers
        )
        
        if response.status_code == 201:
            result = response.json()
            request_id = result['request_id']
            print(f"   ✅ Application created: {result['application_number']}")
            print(f"   Request ID: {request_id}")
            
            # Now upload a test document
            print("\n2. Uploading test document...")
            
            # Create a simple test PDF or use existing one
            test_file = "test_document.txt"
            with open(test_file, "w") as f:
                f.write("This is a test document\nName: OCR Test User\nStudent ID: 12345")
            
            files = {'file': open(test_file, 'rb')}
            data = {'document_type': 'Test Document'}
            
            upload_response = requests.post(
                f"{API_BASE}/scholarship-verification/upload/{request_id}",
                files=files,
                data=data,
                headers=headers
            )
            
            if upload_response.status_code == 200:
                upload_result = upload_response.json()
                print(f"   ✅ Document uploaded: {upload_result['document_id']}")
                print(f"   Verification status: {upload_result['verification_status']}")
                
                # Get verification details
                print("\n3. Checking verification details...")
                details_response = requests.get(
                    f"{API_BASE}/scholarship-verification/verification-details/{request_id}",
                    headers=headers
                )
                
                if details_response.status_code == 200:
                    details = details_response.json()
                    print(f"   Overall score: {details.get('overall_score', 'N/A')}")
                    print(f"   Documents: {len(details.get('documents', []))}")
                    
                    for doc in details.get('documents', []):
                        print(f"\n   Document: {doc['type']}")
                        print(f"     Verified: {doc['is_verified']}")
                        if doc.get('ocr_text'):
                            print(f"     OCR text: {doc['ocr_text'][:100]}...")
                        else:
                            print(f"     ❌ NO OCR TEXT!")
                    
                    ver_results = details.get('verification_results', {})
                    if ver_results:
                        print(f"\n   ✅ Verification results found for {len(ver_results)} documents")
                    else:
                        print(f"\n   ❌ NO VERIFICATION RESULTS!")
                else:
                    print(f"   ❌ Failed to get details: {details_response.status_code}")
            else:
                print(f"   ❌ Upload failed: {upload_response.status_code}")
                print(f"   Error: {upload_response.text}")
            
            os.remove(test_file)
        else:
            print(f"   ❌ Application creation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    print("\n⚠️  NOTE: You need to:")
    print("1. Make sure the backend server is restarted")
    print("2. Update the TOKEN variable with your auth token")
    print("3. Run this script")
    print("\nPress Enter to continue or Ctrl+C to exit...")
    input()
    test_ocr()
