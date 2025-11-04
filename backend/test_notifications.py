"""
Test script for notifications module
Tests authentication, notification creation, and retrieval
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
MONGO_AUTH_URL = "http://localhost:8000/api/v1/mongo-auth"

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{BLUE}ℹ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠ {message}{RESET}")

def print_section(title):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{title:^60}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")


class NotificationTester:
    def __init__(self):
        self.token = None
        self.user_data = None
        
    def test_health_check(self):
        """Test if backend is running"""
        print_section("1. Health Check")
        try:
            response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=5)
            if response.status_code == 200:
                print_success(f"Backend is running: {response.json()}")
                return True
            else:
                print_error(f"Backend returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print_error(f"Backend is not running: {e}")
            print_info("Please start the backend server first:")
            print_info("  cd f:\\camps\\backend")
            print_info("  venv312\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000")
            return False
    
    def test_login(self, username="admin", password="admin123"):
        """Test login and get access token"""
        print_section("2. Login Test")
        
        # Try multiple credentials
        credentials = [
            {"username_or_email": username, "password": password},
            {"username_or_email": "admin", "password": "admin"},
            {"username_or_email": "testuser", "password": "test123"},
        ]
        
        for cred in credentials:
            print_info(f"Trying to login with username: {cred['username_or_email']}")
            try:
                response = requests.post(
                    f"{MONGO_AUTH_URL}/login",
                    json=cred,
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("access_token")
                    self.user_data = data.get("user", {})
                    print_success(f"Login successful!")
                    print_info(f"User: {self.user_data.get('username')} ({self.user_data.get('role')})")
                    print_info(f"Token: {self.token[:30]}...")
                    return True
                else:
                    print_warning(f"Login failed for {cred['username_or_email']}: {response.status_code}")
                    if response.text:
                        print_warning(f"Response: {response.text[:200]}")
            except requests.exceptions.RequestException as e:
                print_error(f"Login request failed: {e}")
        
        print_error("All login attempts failed!")
        print_info("Please create a user or check credentials in MongoDB")
        return False
    
    def test_get_notifications(self):
        """Test getting notifications"""
        print_section("3. Get Notifications Test")
        
        if not self.token:
            print_error("No authentication token. Please login first.")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            print_info("Fetching notifications...")
            response = requests.get(
                f"{BASE_URL}/notifications",
                headers=headers,
                timeout=5
            )
            
            print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                notifications = response.json()
                print_success(f"Successfully retrieved {len(notifications)} notifications")
                
                if len(notifications) > 0:
                    print_info("\nNotifications:")
                    for i, notif in enumerate(notifications[:5], 1):  # Show first 5
                        print(f"\n  {i}. {notif.get('title')}")
                        print(f"     Message: {notif.get('message')[:80]}...")
                        print(f"     Type: {notif.get('notification_type')}")
                        print(f"     Read: {'Yes' if notif.get('is_read') else 'No'}")
                        print(f"     Sent: {notif.get('sent_at')}")
                    
                    if len(notifications) > 5:
                        print(f"\n  ... and {len(notifications) - 5} more notifications")
                else:
                    print_warning("No notifications found in database")
                    print_info("This is normal if no scholarship applications have been reviewed")
                
                return True
                
            elif response.status_code == 401:
                print_error("Unauthorized - Token may be invalid or expired")
                print_info("Response: " + response.text)
                return False
                
            elif response.status_code == 500:
                print_error("Internal Server Error")
                print_info("Response: " + response.text)
                print_warning("Check backend terminal for detailed error traceback")
                return False
            else:
                print_error(f"Unexpected status code: {response.status_code}")
                print_info("Response: " + response.text[:500])
                return False
                
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False
    
    def test_mark_as_read(self, notification_id=None):
        """Test marking notification as read"""
        print_section("4. Mark Notification as Read Test")
        
        if not self.token:
            print_error("No authentication token. Please login first.")
            return False
        
        if not notification_id:
            print_warning("No notification ID provided. Skipping this test.")
            print_info("Run this script after creating some notifications")
            return True
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            print_info(f"Marking notification {notification_id} as read...")
            response = requests.put(
                f"{BASE_URL}/notifications/{notification_id}/read",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                print_success("Notification marked as read successfully")
                return True
            else:
                print_error(f"Failed with status {response.status_code}")
                print_info("Response: " + response.text)
                return False
                
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False
    
    def test_unread_notifications(self):
        """Test getting only unread notifications"""
        print_section("5. Get Unread Notifications Test")
        
        if not self.token:
            print_error("No authentication token. Please login first.")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            print_info("Fetching unread notifications...")
            response = requests.get(
                f"{BASE_URL}/notifications?unread_only=true",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                notifications = response.json()
                print_success(f"Found {len(notifications)} unread notifications")
                return True
            else:
                print_error(f"Failed with status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}{'NOTIFICATION MODULE TEST SUITE':^60}{RESET}")
        print(f"{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
        print(f"{BLUE}{'='*60}{RESET}")
        
        results = {
            "health_check": False,
            "login": False,
            "get_notifications": False,
            "unread_notifications": False
        }
        
        # Test 1: Health Check
        results["health_check"] = self.test_health_check()
        if not results["health_check"]:
            print_error("\n❌ Backend is not running. Cannot proceed with tests.")
            return results
        
        # Test 2: Login
        results["login"] = self.test_login()
        if not results["login"]:
            print_error("\n❌ Login failed. Cannot proceed with authenticated tests.")
            self.print_summary(results)
            return results
        
        # Test 3: Get notifications
        results["get_notifications"] = self.test_get_notifications()
        
        # Test 4: Get unread notifications
        results["unread_notifications"] = self.test_unread_notifications()
        
        # Print summary
        self.print_summary(results)
        
        return results
    
    def print_summary(self, results):
        """Print test summary"""
        print_section("TEST SUMMARY")
        
        total = len(results)
        passed = sum(1 for v in results.values() if v)
        
        for test_name, passed_flag in results.items():
            status = f"{GREEN}PASSED{RESET}" if passed_flag else f"{RED}FAILED{RESET}"
            print(f"{test_name.replace('_', ' ').title():.<40} {status}")
        
        print(f"\n{BLUE}{'='*60}{RESET}")
        percentage = (passed / total * 100) if total > 0 else 0
        color = GREEN if percentage == 100 else YELLOW if percentage >= 50 else RED
        print(f"{color}Total: {passed}/{total} tests passed ({percentage:.1f}%){RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        if passed == total:
            print_success("🎉 All tests passed! Notifications module is working correctly!")
        elif passed > 0:
            print_warning("⚠️  Some tests passed. Check failed tests above.")
        else:
            print_error("❌ All tests failed. Please check backend logs and configuration.")


def main():
    """Main function"""
    tester = NotificationTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
