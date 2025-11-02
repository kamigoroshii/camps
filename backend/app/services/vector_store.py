"""
Vector store service for managing embeddings and similarity search using Qdrant
"""

import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStore:
    """Manages vector embeddings and similarity search using Qdrant"""
    
    def __init__(self):
        self.client: Optional[QdrantClient] = None
        self.embedding_model: Optional[SentenceTransformer] = None
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize Qdrant client and embedding model"""
        if self.is_initialized:
            return
        
        try:
            # Initialize Qdrant client
            self.client = QdrantClient(url=settings.QDRANT_URL)
            logger.info(f"Connected to Qdrant at {settings.QDRANT_URL}")
            
            # Initialize embedding model
            self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
            
            # Create collection if it doesn't exist
            await self._ensure_collection_exists()
            
            self.is_initialized = True
            logger.info("Vector store initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise
    
    async def _ensure_collection_exists(self):
        """Create Qdrant collection if it doesn't exist"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if settings.QDRANT_COLLECTION not in collection_names:
                self.client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION,
                    vectors_config=models.VectorParams(
                        size=384,  # all-MiniLM-L6-v2 dimension
                        distance=models.Distance.COSINE
                    ),
                    optimizers_config=models.OptimizersConfigDiff(
                        indexing_threshold=0
                    )
                )
                logger.info(f"Created Qdrant collection: {settings.QDRANT_COLLECTION}")
            else:
                logger.info(f"Using existing Qdrant collection: {settings.QDRANT_COLLECTION}")
                
        except Exception as e:
            logger.error(f"Error ensuring collection exists: {e}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        if not self.embedding_model:
            raise Exception("Embedding model not initialized")
        
        try:
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    async def store_document_chunks(
        self,
        chunks: List[str],
        metadata: Dict[str, Any],
        filename: str,
        user_id: str,
        request_id: Optional[str] = None
    ) -> int:
        """Store document chunks in vector database"""
        if not self.is_initialized:
            await self.initialize()
        
        try:
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            
            # Create points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_metadata = metadata.copy()
                point_metadata.update({
                    'text': chunk,
                    'chunk_index': i,
                    'total_chunks': len(chunks),
                    'filename': filename,
                    'user_id': user_id,
                    'request_id': request_id,
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
                
                points.append(models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload=point_metadata
                ))
            
            # Upload to Qdrant
            self.client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=points
            )
            logger.info(f"Stored {len(points)} chunks for {filename}")
            
            return len(points)
            
        except Exception as e:
            logger.error(f"Error storing chunks: {e}")
            raise
    
    async def search_similar_chunks(
        self,
        query: str,
        limit: int = None,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar chunks using vector similarity"""
        if not self.is_initialized:
            await self.initialize()
        
        limit = limit or settings.MAX_CONTEXT_CHUNKS
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])[0].tolist()
            
            # Prepare filter
            search_filter = None
            if filter_conditions:
                search_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key=key,
                            match=models.MatchValue(value=value)
                        )
                        for key, value in filter_conditions.items()
                    ]
                )
            
            # Search in Qdrant
            search_results = self.client.search(
                collection_name=settings.QDRANT_COLLECTION,
                query_vector=query_embedding,
                limit=limit,
                query_filter=search_filter,
                with_payload=True
            )
            
            # Format results
            results = []
            for hit in search_results:
                results.append({
                    'text': hit.payload.get('text', ''),
                    'filename': hit.payload.get('filename', ''),
                    'chunk_index': hit.payload.get('chunk_index', 0),
                    'score': hit.score,
                    'metadata': hit.payload,
                    'request_id': hit.payload.get('request_id'),
                    'user_id': hit.payload.get('user_id')
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching chunks: {e}")
            return []
    
    async def delete_document(self, filename: str, user_id: str) -> bool:
        """Delete all chunks of a document"""
        if not self.is_initialized:
            await self.initialize()
        
        try:
            self.client.delete(
                collection_name=settings.QDRANT_COLLECTION,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="filename",
                                match=models.MatchValue(value=filename)
                            ),
                            models.FieldCondition(
                                key="user_id",
                                match=models.MatchValue(value=user_id)
                            )
                        ]
                    )
                )
            )
            logger.info(f"Deleted document: {filename} for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        if not self.is_initialized:
            await self.initialize()
        
        try:
            collection_info = self.client.get_collection(settings.QDRANT_COLLECTION)
            return {
                'name': settings.QDRANT_COLLECTION,
                'points_count': collection_info.points_count,
                'vectors_count': collection_info.vectors_count,
                'status': collection_info.status
            }
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            return {}
    
    async def list_documents(self, user_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """List all documents in the collection"""
        if not self.is_initialized:
            await self.initialize()
        
        try:
            # Prepare filter
            scroll_filter = None
            if user_id:
                scroll_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="user_id",
                            match=models.MatchValue(value=user_id)
                        )
                    ]
                )
            
            # Scroll through collection
            results = self.client.scroll(
                collection_name=settings.QDRANT_COLLECTION,
                scroll_filter=scroll_filter,
                limit=limit,
                with_payload=True
            )
            
            # Group by filename
            documents = {}
            for point in results[0]:
                filename = point.payload.get('filename', 'Unknown')
                if filename not in documents:
                    documents[filename] = {
                        'filename': filename,
                        'file_type': point.payload.get('file_type', ''),
                        'upload_date': point.payload.get('created_at', ''),
                        'user_id': point.payload.get('user_id', ''),
                        'request_id': point.payload.get('request_id'),
                        'chunks': 0
                    }
                documents[filename]['chunks'] += 1
            
            return list(documents.values())
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []
    
    async def close(self):
        """Close connections"""
        if self.client:
            self.client.close()
            logger.info("Qdrant client closed")


# Global instance
vector_store = VectorStore()
