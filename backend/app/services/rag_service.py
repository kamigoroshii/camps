"""
RAG Service - Main entry point
"""

from app.services.rag_service_new import enhanced_rag_service

rag_service = enhanced_rag_service
__all__ = ["rag_service"]
