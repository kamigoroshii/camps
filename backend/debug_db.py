"""
Debug script to check database state
"""
import sqlite3
import json

def check_database():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("DATABASE DEBUG INFORMATION")
    print("=" * 60)
    
    # Check service_requests table
    print("\n📋 SERVICE REQUESTS:")
    cursor.execute("SELECT id, request_number, user_id, request_type, status, created_at FROM service_requests")
    requests = cursor.fetchall()
    
    if not requests:
        print("  ⚠️  No requests found in database")
    else:
        for req in requests:
            print(f"\n  ID: {req[0]}")
            print(f"  Number: {req[1]}")
            print(f"  User ID: {req[2]}")
            print(f"  Type: {req[3]}")
            print(f"  Status: {req[4]}")
            print(f"  Created: {req[5]}")
    
    # Check documents table
    print("\n\n📄 DOCUMENTS:")
    cursor.execute("SELECT id, request_id, filename, original_filename, document_type, uploaded_by, created_at FROM documents")
    documents = cursor.fetchall()
    
    if not documents:
        print("  ⚠️  No documents found in database")
    else:
        for doc in documents:
            print(f"\n  Doc ID: {doc[0]}")
            print(f"  Request ID: {doc[1]}")
            print(f"  Filename: {doc[2]}")
            print(f"  Original: {doc[3]}")
            print(f"  Type: {doc[4]}")
            print(f"  Uploaded By: {doc[5]}")
            print(f"  Created: {doc[6]}")
    
    # Check users table
    print("\n\n👤 USERS:")
    cursor.execute("SELECT id, username, email, role FROM users LIMIT 5")
    users = cursor.fetchall()
    
    if not users:
        print("  ⚠️  No users found in database")
    else:
        for user in users:
            print(f"\n  User ID: {user[0]}")
            print(f"  Username: {user[1]}")
            print(f"  Email: {user[2]}")
            print(f"  Role: {user[3]}")
    
    print("\n" + "=" * 60)
    
    conn.close()

if __name__ == "__main__":
    check_database()
