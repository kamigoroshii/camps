"""
RAG (Retrieval-Augmented Generation) service for intelligent document Q&A
"""

import logging
from typing import List, Dict, Any, Optional

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from app.core.config import settings
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG-based document Q&A"""
    
    def __init__(self):
        self.gemini_model = None
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize RAG service"""
        if self.is_initialized:
            return
        
        try:
            # Initialize vector store
            await vector_store.initialize()
            
            # Initialize Gemini if available and API key is provided
            if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)
                logger.info(f"Initialized Gemini model: {settings.GEMINI_MODEL}")
            elif settings.OPENAI_API_KEY:
                logger.info("Using OpenAI for RAG responses")
            else:
                logger.warning("No AI model configured for RAG")
            
            self.is_initialized = True
            logger.info("RAG service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            raise
    
    async def generate_response(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        language: str = 'english',
        use_gemini: bool = True
    ) -> str:
        """Generate response using AI model based on context"""
        try:
            # Build context from chunks
            context_parts = []
            for chunk in context_chunks:
                source_info = f"[Source: {chunk['filename']}, Chunk {chunk['chunk_index'] + 1}]"
                context_parts.append(f"{source_info}\n{chunk['text']}")
            
            context = "\n\n---\n\n".join(context_parts)
            
            # Create prompt based on language
            prompt = self._build_prompt(query, context, language)
            
            # Generate response using appropriate model
            if use_gemini and self.gemini_model:
                response = await self._generate_with_gemini(prompt)
            else:
                response = await self._generate_with_openai(prompt)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I apologize, but I encountered an error while processing your question. Please try again later."
    
    def _build_prompt(self, query: str, context: str, language: str) -> str:
        """Build prompt for AI model"""
        if context.strip():
            if language == 'malayalam':
                return f"""നൽകിയിരിക്കുന്ന സന്ദർഭത്തെ അടിസ്ഥാനമാക്കി ഉപയോക്താവിന്റെ ചോദ്യത്തിന് കൃത്യമായും സമഗ്രമായും മലയാളത്തിൽ ഉത്തരം നൽകുക.

സന്ദർഭം:
{context}

ചോദ്യം: {query}

നിർദ്ദേശങ്ങൾ:
- മലയാളത്തിൽ വിശദമായ ഉത്തരം നൽകുക
- സന്ദർഭത്തിൽ മതിയായ വിവരങ്ങൾ ഇല്ലെങ്കിൽ, എന്ത് വിവരങ്ങൾ കാണുന്നില്ല എന്ന് വ്യക്തമായി പറയുക
- സാധ്യമായിടത്ത് നിർദ്ദിഷ്ട സ്രോതസ്സുകൾ ഉദ്ധരിക്കുക
- മാർക്ക്ഡൗൺ ഫോർമാറ്റിംഗ് ഉപയോഗിക്കുക
- കാമ്പസ് സേവനങ്ങളിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക

ഉത്തരം:"""
            else:
                return f"""Based on the following context from campus documents, answer the user's question accurately and comprehensively.

Context:
{context}

Question: {query}

Instructions:
- Provide a detailed answer based on the context
- If the context doesn't contain enough information, clearly state what information is missing
- Cite specific sources when possible
- Use proper markdown formatting for better readability
- Focus on campus services and policies
- Be helpful and professional

Answer:"""
        else:
            if language == 'malayalam':
                return f"""ഈ ചോദ്യത്തിന് ഉത്തരം നൽകാൻ എനിക്ക് പ്രസക്തമായ ഡോക്യുമെന്റ് സന്ദർഭം ഇല്ല.

ചോദ്യം: {query}

കൃത്യമായ ഉത്തരം നൽകാൻ ദയവായി പ്രസക്തമായ കാമ്പസ് ഡോക്യുമെന്റുകൾ അപ്‌ലോഡ് ചെയ്യുക അല്ലെങ്കിൽ നിർദ്ദിഷ്ട വിവരങ്ങൾ നൽകുക.

ഉത്തരം:"""
            else:
                return f"""I don't have any relevant document context to answer this question accurately.

Question: {query}

Please upload relevant campus documents or provide more specific information about campus services to get an accurate answer.

Answer:"""
    
    async def _generate_with_gemini(self, prompt: str) -> str:
        """Generate response using Gemini"""
        try:
            response = self.gemini_model.generate_content(prompt)
            if response.text:
                return response.text.strip()
            else:
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
        except Exception as e:
            logger.error(f"Error generating response with Gemini: {e}")
            raise
    
    async def _generate_with_openai(self, prompt: str) -> str:
        """Generate response using OpenAI"""
        try:
            # TODO: Implement OpenAI integration
            from openai import AsyncOpenAI
            
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model=settings.AI_MODEL_NAME,
                messages=[
                    {"role": "system", "content": "You are a helpful campus assistant that provides accurate information based on campus documents."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating response with OpenAI: {e}")
            raise
    
    async def process_query(
        self,
        query: str,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        language: str = 'english',
        max_chunks: int = None
    ) -> Dict[str, Any]:
        """Process a user query and return response with sources"""
        if not self.is_initialized:
            await self.initialize()
        
        try:
            # Prepare filter conditions
            filter_conditions = {}
            if user_id:
                filter_conditions['user_id'] = user_id
            if request_id:
                filter_conditions['request_id'] = request_id
            
            # Search for relevant chunks
            relevant_chunks = await vector_store.search_similar_chunks(
                query=query,
                limit=max_chunks or settings.MAX_CONTEXT_CHUNKS,
                filter_conditions=filter_conditions if filter_conditions else None
            )
            
            # Generate response
            response = await self.generate_response(query, relevant_chunks, language)
            
            # Format sources
            sources = []
            for chunk in relevant_chunks:
                sources.append({
                    'id': f"source_{len(sources)}",
                    'title': chunk['filename'],
                    'snippet': chunk['text'][:200] + '...' if len(chunk['text']) > 200 else chunk['text'],
                    'score': round(chunk['score'], 3),
                    'chunk_index': chunk['chunk_index'],
                    'filename': chunk['filename'],
                    'metadata': chunk.get('metadata', {})
                })
            
            return {
                'response': response,
                'sources': sources,
                'query': query,
                'language': language
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            raise


# Global instance
rag_service = RAGService()
