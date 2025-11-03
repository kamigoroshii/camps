"""
MongoDB User Service for authentication operations
"""

import logging
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.core.database import get_mongo_db
from app.models.mongo_models import MongoUser, UserCreate, UserUpdate, UserStatus
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


class MongoUserService:
    """Service class for MongoDB user operations"""
    
    def __init__(self):
        self.collection_name = "users"
    
    async def get_collection(self):
        """Get users collection from MongoDB"""
        db = get_mongo_db()
        return db[self.collection_name]
    
    async def create_indexes(self):
        """Create necessary indexes for the users collection"""
        try:
            collection = await self.get_collection()
            
            # Create unique indexes
            await collection.create_index("email", unique=True)
            await collection.create_index("username", unique=True)
            await collection.create_index("student_id", unique=True, sparse=True)
            await collection.create_index("employee_id", unique=True, sparse=True)
            
            logger.info("MongoDB user indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating user indexes: {e}")
    
    async def create_user(self, user_data: UserCreate) -> MongoUser:
        """Create a new user"""
        try:
            collection = await self.get_collection()
            
            # Hash password (truncation handled in get_password_hash)
            hashed_password = get_password_hash(user_data.password)
            
            # Create user document
            user_dict = user_data.model_dump(exclude={"password"})
            user_dict["hashed_password"] = hashed_password
            user_dict["status"] = UserStatus.ACTIVE  # Auto-activate for development
            user_dict["created_at"] = datetime.utcnow()
            
            # Insert user
            result = await collection.insert_one(user_dict)
            
            # Retrieve created user
            created_user = await collection.find_one({"_id": result.inserted_id})
            return MongoUser(**created_user)
            
        except DuplicateKeyError as e:
            logger.error(f"Duplicate user creation attempt: {e}")
            raise ValueError("User with this email or username already exists")
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[MongoUser]:
        """Get user by ID"""
        try:
            collection = await self.get_collection()
            user_data = await collection.find_one({"_id": ObjectId(user_id)})
            
            if user_data:
                return MongoUser(**user_data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[MongoUser]:
        """Get user by email"""
        try:
            collection = await self.get_collection()
            user_data = await collection.find_one({"email": email})
            
            if user_data:
                return MongoUser(**user_data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_username(self, username: str) -> Optional[MongoUser]:
        """Get user by username"""
        try:
            collection = await self.get_collection()
            user_data = await collection.find_one({"username": username})
            
            if user_data:
                return MongoUser(**user_data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None
    
    async def authenticate_user(self, username_or_email: str, password: str) -> Optional[MongoUser]:
        """Authenticate user by username/email and password"""
        try:
            from app.core.security import verify_password
            
            # Try to find user by email or username
            user = await self.get_user_by_email(username_or_email)
            if not user:
                user = await self.get_user_by_username(username_or_email)
            
            if user and user.hashed_password and verify_password(password, user.hashed_password):
                # Update last login
                await self.update_last_login(str(user.id))
                return user
            
            return None
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    async def update_user(self, user_id: str, update_data: UserUpdate) -> Optional[MongoUser]:
        """Update user information"""
        try:
            collection = await self.get_collection()
            
            # Prepare update document
            update_dict = update_data.model_dump(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            # Update user
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_dict}
            )
            
            if result.modified_count > 0:
                return await self.get_user_by_id(user_id)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None
    
    async def update_last_login(self, user_id: str) -> bool:
        """Update user's last login timestamp"""
        try:
            collection = await self.get_collection()
            
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
            return False
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user (soft delete by setting status to inactive)"""
        try:
            collection = await self.get_collection()
            
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "status": UserStatus.INACTIVE,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[MongoUser]:
        """Get all users with pagination"""
        try:
            collection = await self.get_collection()
            
            cursor = collection.find().skip(skip).limit(limit)
            users = []
            
            async for user_data in cursor:
                users.append(MongoUser(**user_data))
            
            return users
            
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []
    
    async def count_users(self) -> int:
        """Count total number of users"""
        try:
            collection = await self.get_collection()
            return await collection.count_documents({})
            
        except Exception as e:
            logger.error(f"Error counting users: {e}")
            return 0


# Global instance
mongo_user_service = MongoUserService()