from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# SQLAlchemy Base
Base = declarative_base()

# PostgreSQL Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# MongoDB Client
mongo_client: AsyncIOMotorClient = None
mongo_db = None

# Redis Client
redis_client = None


async def init_db():
    """Initialize database connections"""
    global mongo_client, mongo_db, redis_client
    
    try:
        # Initialize MongoDB
        mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
        mongo_db = mongo_client[settings.MONGO_DB]
        logger.info("MongoDB connected successfully")
        
        # Initialize Redis
        redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("Redis connected successfully")
        
        # Create PostgreSQL tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL tables created successfully")
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise


async def close_db():
    """Close database connections"""
    global mongo_client, redis_client
    
    try:
        if mongo_client:
            mongo_client.close()
            logger.info("MongoDB connection closed")
        
        if redis_client:
            await redis_client.close()
            logger.info("Redis connection closed")
        
        await engine.dispose()
        logger.info("PostgreSQL connection closed")
        
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_mongo_db():
    """Get MongoDB database instance"""
    return mongo_db


async def get_redis():
    """Get Redis client instance"""
    return redis_client
