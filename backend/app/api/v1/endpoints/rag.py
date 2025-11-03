"""
RAG and Document Q&A endpoints
"""

import os
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import vector_store
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models
class ChatRequest(BaseModel):
    message: str
    context_type: Optional[str] = "general"
    context_name: Optional[str] = ""
    chat_id: Optional[str] = None
    language: Optional[str] = "english"
    request_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    chat_id: str
    sources: list
    query: str
    language: str


class DocumentUploadResponse(BaseModel):
    success: bool
    filename: str
    chunks_created: int
    text_length: int
    message: str


class DocumentListResponse(BaseModel):
    documents: list
    total_documents: int
    total_chunks: int


class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    services: dict


@router.get("/health", response_model=HealthCheckResponse, tags=["RAG"])
async def health_check():
    """Health check endpoint for RAG services"""
    try:
        collection_info = await vector_store.get_collection_info()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "vector_store": vector_store.is_initialized,
                "rag_service": rag_service.is_initialized,
                "embedding_model": settings.EMBEDDING_MODEL,
                "qdrant_collection": collection_info.get('name', 'Not initialized'),
                "points_count": collection_info.get('points_count', 0)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=DocumentUploadResponse, tags=["RAG"])
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Body(...),
    request_id: Optional[str] = Body(None)
):
    """
    Upload and process a document for RAG
    
    Supports: PDF, DOCX, TXT, CSV, XLSX, and image files
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        # Check file extension
        filename = file.filename.lower()
        file_ext = None
        for ext in settings.ALLOWED_FILE_EXTENSIONS:
            if filename.endswith(f".{ext}"):
                file_ext = f".{ext}"
                break
        
        if not file_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {settings.ALLOWED_FILE_EXTENSIONS}"
            )
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
            )
        
        # Save file to uploads directory
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Extract text
        text = DocumentProcessor.extract_text(file_content, file_ext)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in file")
        
        # Chunk the text
        chunks = DocumentProcessor.chunk_text(text)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="Failed to create text chunks")
        
        # Prepare metadata
        metadata = {
            'original_filename': file.filename,
            'file_type': file_ext,
            'uploaded_by': user_id,
            'upload_date': datetime.now().isoformat(),
            'file_size': len(file_content),
            'total_text_length': len(text)
        }
        
        # Store in vector database
        chunks_stored = await vector_store.store_document_chunks(
            chunks=chunks,
            metadata=metadata,
            filename=file.filename,
            user_id=user_id,
            request_id=request_id
        )
        
        return {
            "success": True,
            "filename": file.filename,
            "chunks_created": chunks_stored,
            "text_length": len(text),
            "message": f"Document uploaded and processed successfully. {chunks_stored} chunks created."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse, tags=["RAG"])
async def chat(request: ChatRequest):
    """
    Process chat message and generate AI response using enhanced RAG with contextual awareness
    """
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="No message provided")
        
        # Process query with enhanced RAG service
        result = await rag_service.process_query_with_context(
            query=request.message,
            user_id=None,  # Can be extracted from authentication if needed
            session_id=request.chat_id,
            request_id=request.request_id,
            language=request.language,
            conversation_history=None  # Can be implemented for conversation memory
        )
        
        return {
            "response": result['response'],
            "chat_id": request.chat_id or "new_chat",
            "sources": result['sources'],
            "query": result['query'],
            "language": result['language']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enhanced chat processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/documents", response_model=DocumentListResponse, tags=["RAG"])
async def list_documents(
    user_id: Optional[str] = None,
    limit: int = 100
):
    """List uploaded documents"""
    try:
        documents = await vector_store.list_documents(user_id=user_id, limit=limit)
        collection_info = await vector_store.get_collection_info()
        
        return {
            "documents": documents,
            "total_documents": len(documents),
            "total_chunks": collection_info.get('points_count', 0)
        }
        
    except Exception as e:
        logger.error(f"Document list error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve documents")


@router.delete("/documents/{filename}", tags=["RAG"])
async def delete_document(filename: str, user_id: str):
    """Delete a document and all its chunks"""
    try:
        success = await vector_store.delete_document(filename=filename, user_id=user_id)
        
        if success:
            return {"success": True, "message": f"Document '{filename}' deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found or deletion failed")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")


@router.post("/documents/clear", tags=["RAG"])
async def clear_all_documents():
    """Clear all documents from vector store (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        # Recreate collection
        await vector_store.client.delete_collection(settings.QDRANT_COLLECTION)
        await vector_store._ensure_collection_exists()
        
        return {"success": True, "message": "All documents cleared successfully"}
        
    except Exception as e:
        logger.error(f"Clear documents error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear documents")


@router.get("/documents/{filename}/view", tags=["RAG"])
async def view_document(filename: str):
    """Serve document for viewing"""
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Document not found")
        
        return FileResponse(file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document view error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve document")
