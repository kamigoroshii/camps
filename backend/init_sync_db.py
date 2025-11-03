from app.core.database import Base
from sqlalchemy import create_engine
from app.core.config import settings

# Use the same database URL as your async engine, but with create_engine
# Convert async URL to sync URL for table creation
sync_url = settings.DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite://")
engine = create_engine(sync_url, echo=True)

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")