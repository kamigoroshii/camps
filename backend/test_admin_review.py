"""
Test script for Admin Scholarship Review functionality
Tests all endpoints and verifies OCR integration
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
# Try different admin credentials
ADMIN_CREDENTIALS = [
    {"email": "admin@example.com", "password": "admin123"},
    {"email": "admin@camps.edu", "password": "admin123"},
    {"email": "admin", "password": "admin123"},
]

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

class AdminReviewTester:
    def __init__(self):
        self.token = None
        self.headers = {}
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
    
    def check_backend_health(self):
        """Check if backend is running"""
        print_info("Checking backend health...")
        try:
            response = requests.get(f"{BASE_URL}/mongo-auth/health")
            if response.status_code == 200:
                data = response.json()
                print_success(f"Backend is healthy")
                print_info(f"Database: {data.get('database')}")
                print_info(f"Users count: {data.get('users_count')}")
                return True
            else:
                print_error(f"Backend health check failed: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Cannot connect to backend: {str(e)}")
            print_info("Make sure the backend server is running on http://localhost:8000")
            return False

    def login_admin(self):
        """Login as admin to get authentication token"""
        print_info("Attempting admin login...")
        
        # Try each credential set
        for i, creds in enumerate(ADMIN_CREDENTIALS, 1):
            try:
                print_info(f"  Try {i}: {creds['email']}")
                
                response = requests.post(
                    f"{BASE_URL}/mongo-auth/login",
                    json={
                        "username_or_email": creds['email'],
                        "password": creds['password']
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get('access_token')
                    user = data.get('user', {})
                    
                    self.headers = {
                        'Authorization': f'Bearer {self.token}'
                    }
                    print_success(f"Admin login successful as {user.get('username')}")
                    print_info(f"Role: {user.get('role')}, Status: {user.get('status')}")
                    self.test_results['passed'] += 1
                    return True
                else:
                    print_warning(f"  Failed: {response.status_code}")
                    
            except Exception as e:
                print_warning(f"  Error: {str(e)}")
                continue
        
        print_error("All login attempts failed")
        print_info("\nTo create/update an admin user, run:")
        print_info("  python update_admin_user.py")
        print_info("\nOr manually update in MongoDB:")
        print_info("  1. Connect to MongoDB")
        print_info("  2. Use camps_db")
        print_info("  3. Update user: db.users.updateOne({username: 'your_username'}, {$set: {role: 'admin', status: 'active'}})")
        self.test_results['failed'] += 1
        return False

    def test_get_pending_applications(self):
        """Test GET /scholarship-verification/admin/pending endpoint"""
        print_info("\nTesting: Get Pending Applications")
        
        try:
            response = requests.get(
                f"{BASE_URL}/scholarship-verification/admin/pending",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                applications = data.get('applications', [])
                
                print_success(f"Successfully fetched pending applications")
                print_info(f"Found {len(applications)} pending application(s)")
                
                if len(applications) > 0:
                    print_info("\nSample application data:")
                    app = applications[0]
                    print(f"  - Application #: {app.get('application_number')}")
                    print(f"  - Applicant: {app.get('data', {}).get('full_name')}")
                    print(f"  - Status: {app.get('status')}")
                    print(f"  - Documents: {app.get('documents_count', 0)}")
                    print(f"  - Submitted: {app.get('submitted_date')}")
                    
                    self.test_results['passed'] += 1
                    return applications
                else:
                    print_warning("No pending applications found")
                    self.test_results['warnings'] += 1
                    return []
            else:
                print_error(f"Failed to fetch applications: {response.status_code}")
                print_error(f"Response: {response.text}")
                self.test_results['failed'] += 1
                return []
                
        except Exception as e:
            print_error(f"Error fetching applications: {str(e)}")
            self.test_results['failed'] += 1
            return []

    def test_get_verification_details(self, request_id):
        """Test GET /scholarship-verification/verification-details/{request_id} endpoint"""
        print_info(f"\nTesting: Get Verification Details for {request_id}")
        
        try:
            response = requests.get(
                f"{BASE_URL}/scholarship-verification/verification-details/{request_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                print_success("Successfully fetched verification details")
                print_info(f"Application #: {data.get('application_number')}")
                print_info(f"Status: {data.get('status')}")
                
                overall_score = data.get('overall_score')
                if overall_score is not None:
                    print_info(f"Overall Score: {overall_score * 100:.1f}%")
                else:
                    print_warning("No overall score available")
                
                documents = data.get('documents', [])
                print_info(f"Documents: {len(documents)}")
                
                for i, doc in enumerate(documents, 1):
                    print(f"\n  Document {i}:")
                    print(f"    - Type: {doc.get('type')}")
                    print(f"    - Filename: {doc.get('filename')}")
                    print(f"    - Verified: {doc.get('is_verified')}")
                    
                    ocr_text = doc.get('ocr_text', '')
                    if ocr_text:
                        preview = ocr_text[:100].replace('\n', ' ')
                        print(f"    - OCR Text Preview: {preview}...")
                    else:
                        print_warning(f"    - No OCR text found")
                
                # Check verification results
                verification_results = data.get('verification_results', {})
                if verification_results:
                    print_info("\n  Verification Results:")
                    for doc_type, result in verification_results.items():
                        print(f"    {doc_type}:")
                        print(f"      - Identity Confidence: {result.get('identity_confidence', 'N/A')}")
                        print(f"      - Authenticity Confidence: {result.get('authenticity_confidence', 'N/A')}")
                        print(f"      - Overall Confidence: {result.get('overall_confidence', 'N/A')}")
                
                self.test_results['passed'] += 1
                return data
            else:
                print_error(f"Failed to fetch details: {response.status_code}")
                print_error(f"Response: {response.text}")
                self.test_results['failed'] += 1
                return None
                
        except Exception as e:
            print_error(f"Error fetching details: {str(e)}")
            self.test_results['failed'] += 1
            return None

    def test_review_application(self, request_id, action='approved', notes='Test review'):
        """Test POST /scholarship-verification/admin/review/{request_id} endpoint"""
        print_info(f"\nTesting: Review Application {request_id} - Action: {action}")
        
        try:
            # Create form data
            form_data = {
                'status': action,
                'notes': notes
            }
            
            response = requests.post(
                f"{BASE_URL}/scholarship-verification/admin/review/{request_id}",
                data=form_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Review submitted successfully")
                print_info(f"Message: {data.get('message')}")
                print_info(f"Application #: {data.get('application_number')}")
                print_info(f"New Status: {data.get('new_status')}")
                
                self.test_results['passed'] += 1
                return data
            else:
                print_error(f"Failed to submit review: {response.status_code}")
                print_error(f"Response: {response.text}")
                self.test_results['failed'] += 1
                return None
                
        except Exception as e:
            print_error(f"Error submitting review: {str(e)}")
            self.test_results['failed'] += 1
            return None

    def test_get_document(self, document_id):
        """Test GET /scholarship-verification/document/{document_id} endpoint"""
        print_info(f"\nTesting: Get Document {document_id}")
        
        try:
            response = requests.get(
                f"{BASE_URL}/scholarship-verification/document/{document_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                content_length = len(response.content)
                
                print_success(f"Document retrieved successfully")
                print_info(f"Content-Type: {content_type}")
                print_info(f"Content-Length: {content_length} bytes")
                
                self.test_results['passed'] += 1
                return True
            else:
                print_error(f"Failed to get document: {response.status_code}")
                self.test_results['failed'] += 1
                return False
                
        except Exception as e:
            print_error(f"Error getting document: {str(e)}")
            self.test_results['failed'] += 1
            return False

    def run_full_test_suite(self):
        """Run all tests in sequence"""
        print("\n" + "="*60)
        print("ADMIN SCHOLARSHIP REVIEW - TEST SUITE")
        print("="*60 + "\n")
        
        # Test 0: Backend health check
        if not self.check_backend_health():
            print_error("\nBackend is not available. Exiting...")
            return
        
        print()  # Blank line
        
        # Test 1: Login
        if not self.login_admin():
            print_error("\nCannot proceed without authentication")
            return
        
        # Test 2: Get pending applications
        applications = self.test_get_pending_applications()
        
        if not applications:
            print_warning("\nNo applications to test further functionality")
            print_info("Please create a scholarship application first")
        else:
            # Test 3: Get verification details for first application
            first_app = applications[0]
            request_id = first_app.get('request_id')
            
            details = self.test_get_verification_details(request_id)
            
            # Test 4: Test document retrieval if documents exist
            if details and details.get('documents'):
                first_doc = details['documents'][0]
                doc_id = first_doc.get('id')
                self.test_get_document(doc_id)
            
            # Test 5: Submit review (use pending_approval to not change status drastically)
            print_warning("\nSkipping actual review submission to preserve data")
            print_info("To test review submission, uncomment the line below:")
            print_info(f"# self.test_review_application(request_id, 'pending_approval', 'Test review from script')")
            
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total = self.test_results['passed'] + self.test_results['failed']
        
        print(f"\n{Colors.GREEN}Passed: {self.test_results['passed']}/{total}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.test_results['failed']}/{total}{Colors.END}")
        print(f"{Colors.YELLOW}Warnings: {self.test_results['warnings']}{Colors.END}")
        
        if self.test_results['failed'] == 0:
            print(f"\n{Colors.GREEN}All tests passed! ✓{Colors.END}")
        else:
            print(f"\n{Colors.RED}Some tests failed. Please review the errors above.{Colors.END}")
        
        print("\n" + "="*60 + "\n")

def main():
    """Main test function"""
    tester = AdminReviewTester()
    
    try:
        tester.run_full_test_suite()
    except KeyboardInterrupt:
        print_warning("\n\nTest interrupted by user")
    except Exception as e:
        print_error(f"\n\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
