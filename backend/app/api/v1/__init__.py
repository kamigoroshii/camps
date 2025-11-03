from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, requests, documents, notifications, dashboard, rag, mongo_auth, dev_tools, test_endpoints, scholarship_verification

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(mongo_auth.router, prefix="/mongo-auth", tags=["MongoDB Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(requests.router, prefix="/requests", tags=["Service Requests"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG"])
api_router.include_router(scholarship_verification.router, tags=["Scholarship Verification"])
api_router.include_router(dev_tools.router, prefix="/dev", tags=["Development Tools"])
api_router.include_router(test_endpoints.router, prefix="/test", tags=["Testing"])
