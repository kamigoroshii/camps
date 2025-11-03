"""
Simple script to check MongoDB users and update admin password
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from app.services.mongo_user_service import mongo_user_service
from app.core.security import get_password_hash, verify_password

async def main():
    """Check and update users"""
    print("="*60)
    print("MongoDB User Management")
    print("="*60 + "\n")
    
    try:
        # Get collection
        collection = await mongo_user_service.get_collection()
        
        # Count users
        count = await collection.count_documents({})
        print(f"Total users in database: {count}\n")
        
        if count == 0:
            print("No users found. Please register a user first.")
            return
        
        # List all users
        print("All users:")
        print("-" * 60)
        
        async for user in collection.find():
            print(f"\nUsername: {user.get('username')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Full Name: {user.get('full_name', 'N/A')}")
            print(f"  Role: {user.get('role', 'user')}")
            print(f"  Status: {user.get('status', 'pending')}")
            print(f"  ID: {user.get('_id')}")
        
        print("\n" + "="*60)
        print("Update Admin User")
        print("="*60)
        
        # Ask which user to make admin
        username = input("\nEnter username to update (or 'skip' to exit): ").strip()
        
        if username.lower() == 'skip':
            print("Exiting...")
            return
        
        # Find user
        user = await collection.find_one({"username": username})
        
        if not user:
            print(f"User '{username}' not found!")
            return
        
        print(f"\nFound user: {user.get('full_name')} ({user.get('email')})")
        print(f"Current role: {user.get('role', 'user')}")
        
        # Update role to admin
        update_role = input("Set role to 'admin'? (y/n): ").strip().lower()
        if update_role == 'y':
            await collection.update_one(
                {"_id": user['_id']},
                {"$set": {"role": "admin", "status": "active", "is_verified": True}}
            )
            print("✓ Role updated to admin")
        
        # Update password
        update_pwd = input("Set password to 'admin123'? (y/n): ").strip().lower()
        if update_pwd == 'y':
            hashed_pwd = get_password_hash("admin123")
            await collection.update_one(
                {"_id": user['_id']},
                {"$set": {"hashed_password": hashed_pwd}}
            )
            print("✓ Password updated to 'admin123'")
        
        print("\n✓ User updated successfully!")
        print(f"\nYou can now login with:")
        print(f"  Username/Email: {user.get('username')} or {user.get('email')}")
        print(f"  Password: admin123")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
