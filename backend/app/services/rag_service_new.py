"""
Enhanced RAG (Retrieval-Augmented Generation) service with contextual awareness
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import asyncio
import json
from datetime import datetime

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from app.core.config import settings
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)


class ContextualRAGService:
    """Enhanced RAG service with contextual awareness and conversation memory"""
    
    def __init__(self):
        self.gemini_model = None
        self.is_initialized = False
        self.conversation_memory = {}  # Store conversation context per user/session
        self.document_cache = {}  # Cache frequently accessed documents
        
    async def initialize(self):
        """Initialize the enhanced RAG service"""
        if self.is_initialized:
            return
        
        try:
            # Initialize vector store
            await vector_store.initialize()
            
            # Initialize AI models with fallback strategy
            await self._initialize_ai_models()
            
            self.is_initialized = True
            logger.info("Enhanced RAG service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            raise
    
    async def _initialize_ai_models(self):
        """Initialize AI models with proper fallback"""
        ai_model_available = False
        
        # Try Gemini first
        if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                # Try different Gemini models in order of preference
                for model_name in ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"]:
                    try:
                        self.gemini_model = genai.GenerativeModel(model_name)
                        # Test the model with a simple request
                        test_response = self.gemini_model.generate_content("Hello")
                        if test_response and hasattr(test_response, 'text'):
                            logger.info(f"Successfully initialized Gemini model: {model_name}")
                            ai_model_available = True
                            break
                    except Exception as e:
                        logger.warning(f"Failed to initialize {model_name}: {e}")
                        continue
            except Exception as e:
                logger.warning(f"Gemini initialization failed: {e}")
        
        if not ai_model_available:
            logger.warning("No AI model available - using enhanced fallback responses")
    
    async def process_query_with_context(
        self,
        query: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        language: str = 'english',
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Process query with full contextual awareness"""
        
        if not self.is_initialized:
            await self.initialize()
        
        try:
            # Build conversation context
            context_key = f"{user_id}_{session_id}" if user_id and session_id else "default"
            
            # Update conversation memory
            if conversation_history:
                self.conversation_memory[context_key] = conversation_history[-5:]  # Keep last 5 exchanges
            
            # Analyze query intent and extract key concepts
            query_analysis = await self._analyze_query(query, language)
            
            # Get relevant documents with contextual search
            relevant_chunks = await self._contextual_document_search(
                query=query,
                query_analysis=query_analysis,
                user_id=user_id,
                request_id=request_id,
                conversation_context=self.conversation_memory.get(context_key, [])
            )
            
            # Generate contextually aware response
            response = await self._generate_contextual_response(
                query=query,
                query_analysis=query_analysis,
                context_chunks=relevant_chunks,
                conversation_history=self.conversation_memory.get(context_key, []),
                language=language
            )
            
            # Update conversation memory
            self._update_conversation_memory(context_key, query, response)
            
            # Format sources with enhanced metadata
            sources = self._format_enhanced_sources(relevant_chunks, query_analysis)
            
            return {
                'response': response,
                'sources': sources,
                'query': query,
                'query_analysis': query_analysis,
                'language': language,
                'context_used': len(relevant_chunks),
                'conversation_turn': len(self.conversation_memory.get(context_key, [])),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing contextual query: {e}")
            return {
                'response': self._get_error_response(language),
                'sources': [],
                'query': query,
                'error': str(e)
            }
    
    async def _analyze_query(self, query: str, language: str) -> Dict[str, Any]:
        """Analyze query to understand intent and extract key concepts"""
        
        analysis = {
            'intent': 'general',
            'key_concepts': [],
            'question_type': 'informational',
            'urgency': 'normal',
            'specificity': 'general',
            'domain': 'general'
        }
        
        query_lower = query.lower()
        
        # Determine intent
        if any(word in query_lower for word in ['how', 'what', 'when', 'where', 'why', 'which']):
            analysis['question_type'] = 'informational'
        elif any(word in query_lower for word in ['help', 'problem', 'issue', 'error', 'not working']):
            analysis['question_type'] = 'problem_solving'
        elif any(word in query_lower for word in ['apply', 'request', 'submit', 'process']):
            analysis['question_type'] = 'procedural'
        
        # Determine domain
        domain_keywords = {
            'academic': ['grade', 'course', 'class', 'exam', 'assignment', 'study', 'academic'],
            'administrative': ['registration', 'enrollment', 'fee', 'payment', 'transcript', 'certificate'],
            'student_services': ['housing', 'dining', 'health', 'counseling', 'library', 'parking'],
            'financial': ['tuition', 'scholarship', 'financial aid', 'billing', 'payment'],
            'technical': ['login', 'password', 'system', 'website', 'portal', 'access']
        }
        
        for domain, keywords in domain_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                analysis['domain'] = domain
                break
        
        # Extract key concepts (simple keyword extraction)
        import re
        words = re.findall(r'\b\w+\b', query_lower)
        # Filter out common words and keep meaningful terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'}
        analysis['key_concepts'] = [word for word in words if len(word) > 2 and word not in stop_words][:10]
        
        # Determine urgency
        if any(word in query_lower for word in ['urgent', 'emergency', 'asap', 'immediately', 'deadline']):
            analysis['urgency'] = 'high'
        elif any(word in query_lower for word in ['soon', 'quickly', 'fast']):
            analysis['urgency'] = 'medium'
        
        # Determine specificity
        if len(analysis['key_concepts']) > 5 or any(word in query_lower for word in ['specific', 'exactly', 'particular']):
            analysis['specificity'] = 'specific'
        
        return analysis
    
    async def _contextual_document_search(
        self,
        query: str,
        query_analysis: Dict[str, Any],
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        conversation_context: List[Dict] = None
    ) -> List[Dict[str, Any]]:
        """Enhanced document search with contextual awareness"""
        
        # Build enhanced search query including context
        enhanced_queries = [query]
        
        # Add domain-specific terms
        if query_analysis['domain'] != 'general':
            domain_terms = {
                'academic': 'academic grades courses classes exams assignments',
                'administrative': 'registration enrollment fees transcripts certificates',
                'student_services': 'housing dining health counseling library parking',
                'financial': 'tuition scholarship financial aid billing payment',
                'technical': 'login password system website portal access'
            }
            if query_analysis['domain'] in domain_terms:
                enhanced_queries.append(f"{query} {domain_terms[query_analysis['domain']]}")
        
        # Add conversation context if available
        if conversation_context:
            recent_context = " ".join([
                turn.get('query', '') + " " + turn.get('response', '')[:100] 
                for turn in conversation_context[-2:]
            ])
            if recent_context.strip():
                enhanced_queries.append(f"{query} {recent_context}")
        
        # Search with multiple strategies
        all_chunks = []
        
        for search_query in enhanced_queries[:3]:  # Limit to top 3 queries
            try:
                # Prepare filter conditions
                filter_conditions = {}
                if user_id:
                    filter_conditions['user_id'] = user_id
                if request_id:
                    filter_conditions['request_id'] = request_id
                
                chunks = await vector_store.search_similar_chunks(
                    query=search_query,
                    limit=settings.MAX_CONTEXT_CHUNKS * 2,  # Get more candidates
                    filter_conditions=filter_conditions if filter_conditions else None
                )
                
                # Add search metadata
                for chunk in chunks:
                    chunk['search_query'] = search_query
                    chunk['relevance_boost'] = 1.0
                
                all_chunks.extend(chunks)
                
            except Exception as e:
                logger.warning(f"Search failed for query '{search_query}': {e}")
                continue
        
        # Deduplicate and rank chunks
        unique_chunks = self._deduplicate_and_rank_chunks(all_chunks, query_analysis)
        
        # Return top chunks
        return unique_chunks[:settings.MAX_CONTEXT_CHUNKS]
    
    def _deduplicate_and_rank_chunks(self, chunks: List[Dict], query_analysis: Dict) -> List[Dict]:
        """Remove duplicates and rank chunks by relevance"""
        
        # Deduplicate by chunk content
        seen_texts = set()
        unique_chunks = []
        
        for chunk in chunks:
            text_key = chunk.get('text', '')[:100]  # Use first 100 chars as key
            if text_key not in seen_texts:
                seen_texts.add(text_key)
                unique_chunks.append(chunk)
        
        # Enhanced ranking based on multiple factors
        for chunk in unique_chunks:
            score = chunk.get('score', 0.0)
            
            # Boost score based on domain relevance
            text_lower = chunk.get('text', '').lower()
            domain = query_analysis.get('domain', 'general')
            
            domain_boost = {
                'academic': ['grade', 'course', 'class', 'exam', 'assignment'],
                'administrative': ['registration', 'enrollment', 'fee', 'transcript'],
                'student_services': ['housing', 'dining', 'health', 'counseling'],
                'financial': ['tuition', 'scholarship', 'financial', 'payment'],
                'technical': ['login', 'password', 'system', 'portal']
            }
            
            if domain in domain_boost:
                boost_count = sum(1 for term in domain_boost[domain] if term in text_lower)
                score += boost_count * 0.1
            
            # Boost recent documents
            upload_date = chunk.get('metadata', {}).get('upload_date', '')
            if upload_date:
                try:
                    from datetime import datetime, timedelta
                    upload_dt = datetime.fromisoformat(upload_date.replace('Z', '+00:00'))
                    days_old = (datetime.now(upload_dt.tzinfo) - upload_dt).days
                    if days_old < 30:  # Recent documents get boost
                        score += 0.05
                except:
                    pass
            
            chunk['final_score'] = score
        
        # Sort by final score
        unique_chunks.sort(key=lambda x: x.get('final_score', 0), reverse=True)
        
        return unique_chunks
    
    async def _generate_contextual_response(
        self,
        query: str,
        query_analysis: Dict[str, Any],
        context_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict],
        language: str = 'english'
    ) -> str:
        """Generate response with full contextual awareness"""
        
        try:
            # Build enhanced context
            context = self._build_enhanced_context(context_chunks, query_analysis, conversation_history)
            
            # Create contextual prompt
            prompt = self._build_contextual_prompt(
                query=query,
                context=context,
                query_analysis=query_analysis,
                conversation_history=conversation_history,
                language=language
            )
            
            # Try AI generation first
            if self.gemini_model:
                try:
                    response = await self._generate_with_ai(prompt)
                    if response and len(response.strip()) > 10:
                        return response
                except Exception as e:
                    logger.warning(f"AI generation failed: {e}")
            
            # Fallback to enhanced contextual response
            return self._generate_enhanced_fallback_response(
                query=query,
                query_analysis=query_analysis,
                context_chunks=context_chunks,
                conversation_history=conversation_history,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error generating contextual response: {e}")
            return self._get_error_response(language)
    
    def _build_enhanced_context(
        self,
        chunks: List[Dict[str, Any]],
        query_analysis: Dict[str, Any],
        conversation_history: List[Dict]
    ) -> str:
        """Build enhanced context with conversation awareness"""
        
        context_parts = []
        
        # Add conversation context if relevant
        if conversation_history:
            recent_context = []
            for turn in conversation_history[-2:]:
                if turn.get('query') and turn.get('response'):
                    recent_context.append(f"Previous Q: {turn['query']}")
                    recent_context.append(f"Previous A: {turn['response'][:200]}...")
            
            if recent_context:
                context_parts.append("**CONVERSATION CONTEXT:**\n" + "\n".join(recent_context))
        
        # Add document context
        if chunks:
            context_parts.append("**DOCUMENT CONTEXT:**")
            
            for i, chunk in enumerate(chunks[:5], 1):  # Limit to top 5 chunks
                filename = chunk.get('filename', 'Unknown Document')
                text = chunk.get('text', '')
                score = chunk.get('final_score', chunk.get('score', 0))
                
                # Clean filename
                display_name = filename.replace('.pdf', '').replace('.docx', '').replace('.doc', '')
                
                context_parts.append(f"\n**Source {i}: {display_name}** (Relevance: {score:.2f})")
                context_parts.append(text[:800] + "..." if len(text) > 800 else text)
        
        return "\n\n".join(context_parts)
    
    def _build_contextual_prompt(
        self,
        query: str,
        context: str,
        query_analysis: Dict[str, Any],
        conversation_history: List[Dict],
        language: str
    ) -> str:
        """Build enhanced prompt with contextual awareness"""
        
        domain = query_analysis.get('domain', 'general')
        question_type = query_analysis.get('question_type', 'informational')
        urgency = query_analysis.get('urgency', 'normal')
        
        if language == 'malayalam':
            return f"""നിങ്ങൾ ഒരു സഹായകാരിയായ കാമ്പസ് AI അസിസ്റ്റന്റാണ്. നൽകിയിരിക്കുന്ന സന്ദർഭത്തിന്റെ അടിസ്ഥാനത്തിൽ വിശദവും കൃത്യവുമായ ഉത്തരം നൽകുക.

**സന്ദർഭം:**
{context}

**ചോദ്യം:** {query}

**നിർദ്ദേശങ്ങൾ:**
- മലയാളത്തിൽ വ്യക്തവും വിശദവുമായ ഉത്തരം നൽകുക
- മാർക്ക്ഡൗൺ ഫോർമാറ്റിംഗ് ഉപയോഗിക്കുക
- സന്ദർഭത്തിലെ വിവരങ്ങൾ അടിസ്ഥാനമാക്കി ഉത്തരം നൽകുക
- വിവരങ്ങൾ കുറവാണെങ്കിൽ, എന്ത് കുറവുണ്ടെന്ന് വ്യക്തമാക്കുക
- സ്രോതസ്സുകൾ ഉദ്ധരിക്കുക

**ഉത്തരം:**"""
        
        else:
            urgency_note = ""
            if urgency == 'high':
                urgency_note = "⚠️ **URGENT REQUEST** - Prioritize immediate, actionable information.\n"
            
            domain_context = {
                'academic': "Focus on academic policies, procedures, and requirements.",
                'administrative': "Focus on enrollment, registration, and administrative procedures.",
                'student_services': "Focus on campus services, facilities, and student support.",
                'financial': "Focus on fees, payments, financial aid, and billing information.",
                'technical': "Focus on system access, technical procedures, and troubleshooting."
            }
            
            domain_instruction = domain_context.get(domain, "Provide comprehensive campus-related information.")
            
            return f"""You are a helpful and knowledgeable campus AI assistant with access to institutional documents and conversation history. Provide a detailed, accurate, and contextually aware response based on the given information.

{urgency_note}
**DOMAIN:** {domain.title()} ({domain_instruction})
**QUESTION TYPE:** {question_type.title()}

**CONTEXT:**
{context}

**CURRENT QUERY:** {query}

**INSTRUCTIONS:**
- Provide a comprehensive, well-structured answer using markdown formatting
- Use ## for main headings, ### for subheadings, **bold** for emphasis
- Reference specific sources from the context using **Source Name:** format
- If previous conversation is relevant, acknowledge it naturally
- If information is incomplete, clearly state what's missing and suggest next steps
- Use bullet points, numbered lists, and blockquotes for better readability
- Be specific about procedures, deadlines, requirements, and contact information
- If this is a follow-up question, build upon previous context appropriately
- Maintain a helpful, professional, and student-friendly tone

**RESPONSE:**"""
    
    def _generate_enhanced_fallback_response(
        self,
        query: str,
        query_analysis: Dict[str, Any],
        context_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict],
        language: str = 'english'
    ) -> str:
        """Generate enhanced fallback response with contextual awareness"""
        
        if not context_chunks:
            return self._get_no_documents_response(query_analysis, language)
        
        # Build contextually aware response
        response_parts = []
        
        # Add conversation awareness
        if conversation_history:
            last_query = conversation_history[-1].get('query', '') if conversation_history else ''
            if last_query and any(word in query.lower() for word in ['more', 'also', 'additionally', 'further']):
                response_parts.append("## Continuing Our Conversation\n")
                response_parts.append("Based on your follow-up question, here's additional information:\n")
        
        # Add main response header
        domain = query_analysis.get('domain', 'general')
        urgency = query_analysis.get('urgency', 'normal')
        
        if urgency == 'high':
            response_parts.append("## ⚠️ Urgent Information Request\n")
        else:
            response_parts.append(f"## {domain.title().replace('_', ' ')} Information\n")
        
        response_parts.append("Here's what I found in the campus documents:\n")
        
        # Add contextual document information
        for i, chunk in enumerate(context_chunks[:3], 1):
            filename = chunk.get('filename', 'Unknown Document')
            text = chunk.get('text', '')
            
            # Clean filename
            display_name = filename.replace('.pdf', '').replace('.docx', '').replace('.doc', '')
            
            response_parts.append(f"\n### 📄 {display_name}\n")
            
            # Extract and format relevant content
            relevant_content = self._extract_contextual_content(text, query_analysis)
            formatted_content = self._format_content_as_markdown(relevant_content)
            response_parts.append(formatted_content)
        
        # Add follow-up suggestions
        follow_up_suggestions = self._generate_follow_up_suggestions(query_analysis, context_chunks)
        if follow_up_suggestions:
            response_parts.append("\n## 💡 Next Steps\n")
            response_parts.append(follow_up_suggestions)
        
        # Add additional help
        if len(context_chunks) > 3:
            response_parts.append(f"\n*📚 Found {len(context_chunks) - 3} additional relevant documents. Ask for more specific information if needed.*")
        
        return "\n".join(response_parts)
    
    def _extract_contextual_content(self, text: str, query_analysis: Dict[str, Any]) -> str:
        """Extract most relevant content based on query analysis"""
        
        if not text or len(text) <= 400:
            return text
        
        key_concepts = query_analysis.get('key_concepts', [])
        domain = query_analysis.get('domain', 'general')
        
        # Split into sentences and score them
        sentences = text.split('. ')
        scored_sentences = []
        
        for sentence in sentences:
            score = 0
            sentence_lower = sentence.lower()
            
            # Score based on key concepts
            for concept in key_concepts:
                if concept in sentence_lower:
                    score += 2
            
            # Score based on domain keywords
            domain_keywords = {
                'academic': ['grade', 'course', 'class', 'exam', 'credit', 'gpa'],
                'administrative': ['register', 'enroll', 'application', 'form', 'deadline'],
                'student_services': ['service', 'facility', 'hours', 'location', 'contact'],
                'financial': ['fee', 'cost', 'payment', 'scholarship', 'aid'],
                'technical': ['system', 'login', 'access', 'password', 'portal']
            }
            
            if domain in domain_keywords:
                for keyword in domain_keywords[domain]:
                    if keyword in sentence_lower:
                        score += 1
            
            scored_sentences.append((sentence, score))
        
        # Get top sentences
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        top_sentences = [sent[0] for sent in scored_sentences[:5] if sent[1] > 0]
        
        if top_sentences:
            result = '. '.join(top_sentences)
            return result if len(result) <= 600 else result[:600] + "..."
        else:
            # Fallback to beginning of text
            return text[:500] + "..." if len(text) > 500 else text
    
    def _format_content_as_markdown(self, content: str) -> str:
        """Format content with proper markdown"""
        
        if not content:
            return "*No relevant content found.*"
        
        lines = content.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Format different types of content
            if line.isupper() and len(line) < 80:
                formatted_lines.append(f"**{line}**")
            elif line.startswith(('1.', '2.', '3.', '4.', '5.')):
                formatted_lines.append(f"- {line}")
            elif line.startswith(('•', '▪', '-')):
                formatted_lines.append(f"- {line[1:].strip()}")
            elif ':' in line and len(line) < 100:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    formatted_lines.append(f"**{parts[0].strip()}:** {parts[1].strip()}")
                else:
                    formatted_lines.append(line)
            else:
                formatted_lines.append(line)
        
        result = '\n'.join(formatted_lines)
        
        # Wrap in blockquote for visual separation
        quoted_lines = [f"> {line}" if line.strip() else ">" for line in result.split('\n')]
        
        return '\n'.join(quoted_lines)
    
    def _generate_follow_up_suggestions(self, query_analysis: Dict[str, Any], context_chunks: List[Dict]) -> str:
        """Generate contextual follow-up suggestions"""
        
        domain = query_analysis.get('domain', 'general')
        question_type = query_analysis.get('question_type', 'informational')
        
        suggestions = []
        
        # Domain-specific suggestions
        domain_suggestions = {
            'academic': [
                "Ask about specific course requirements or prerequisites",
                "Inquire about grade appeal procedures or academic policies",
                "Check graduation requirements or degree audit information"
            ],
            'administrative': [
                "Ask about specific deadlines or required documents",
                "Inquire about application status or next steps",
                "Check contact information for relevant offices"
            ],
            'student_services': [
                "Ask about service hours or location details",
                "Inquire about eligibility requirements or how to apply",
                "Check for additional services or resources available"
            ],
            'financial': [
                "Ask about payment deadlines or methods",
                "Inquire about financial aid application process",
                "Check scholarship opportunities or requirements"
            ]
        }
        
        if domain in domain_suggestions:
            suggestions.extend(domain_suggestions[domain][:2])
        
        # Add general suggestions based on question type
        if question_type == 'procedural':
            suggestions.append("Ask for step-by-step instructions or required documents")
        elif question_type == 'problem_solving':
            suggestions.append("Ask for alternative solutions or escalation procedures")
        
        # Format suggestions
        if suggestions:
            formatted_suggestions = []
            for i, suggestion in enumerate(suggestions, 1):
                formatted_suggestions.append(f"{i}. {suggestion}")
            return '\n'.join(formatted_suggestions)
        
        return "Ask more specific questions about the information above for detailed guidance."
    
    def _get_no_documents_response(self, query_analysis: Dict[str, Any], language: str) -> str:
        """Generate response when no documents are found"""
        
        domain = query_analysis.get('domain', 'general')
        
        if language == 'malayalam':
            return f"""## ഡോക്യുമെന്റുകൾ കണ്ടെത്താനായില്ല

നിങ്ങളുടെ ചോദ്യത്തിന് പ്രസക്തമായ വിവരങ്ങൾ അപ്‌ലോഡ് ചെയ്ത ഡോക്യുമെന്റുകളിൽ കണ്ടെത്താനായില്ല.

**നിർദ്ദേശങ്ങൾ:**
- പ്രസക്തമായ കാമ്പസ് ഡോക്യുമെന്റുകൾ അപ്‌ലോഡ് ചെയ്യുക
- വ്യത്യസ്ത കീവേഡുകൾ ഉപയോഗിച്ച് ചോദ്യം വീണ്ടും ചോദിക്കുക
- കൂടുതൽ വിവരങ്ങൾക്ക് കാമ്പസ് ഓഫീസുകളെ ബന്ധപ്പെടുക"""
        
        domain_help = {
            'academic': "Try uploading academic handbooks, course catalogs, or syllabus documents.",
            'administrative': "Try uploading student handbooks, registration guides, or administrative policies.",
            'student_services': "Try uploading service directories, facility guides, or student resource documents.",
            'financial': "Try uploading fee schedules, financial aid guides, or billing information.",
            'technical': "Try uploading IT support guides, system manuals, or technical documentation."
        }
        
        specific_help = domain_help.get(domain, "Try uploading relevant campus documents or policy handbooks.")
        
        return f"""## No Relevant Documents Found

I couldn't find information about your **{domain.replace('_', ' ')}** question in the uploaded documents.

**What you can do:**
- {specific_help}
- Try rephrasing your question with different keywords
- Ask more specific questions about campus policies or procedures
- Contact the relevant campus office directly for immediate assistance

**💡 Tip:** Upload official campus documents like handbooks, policies, or guides for more accurate information."""
    
    def _get_error_response(self, language: str) -> str:
        """Get error response in appropriate language"""
        
        if language == 'malayalam':
            return """## സിസ്റ്റം പിശക്

ക്ഷമിക്കുക, നിങ്ങളുടെ ചോദ്യം പ്രോസസ്സ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു. ദയവായി കുറച്ച് സമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കുക."""
        
        return """## System Error

I apologize, but I encountered an error while processing your question. Please try again in a moment or contact technical support if the issue persists."""
    
    async def _generate_with_ai(self, prompt: str) -> str:
        """Generate response using AI model"""
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini_model.generate_content, prompt)
            
            if response and hasattr(response, 'text') and response.text:
                return response.text.strip()
            else:
                raise Exception("No valid response from AI model")
                
        except Exception as e:
            logger.warning(f"AI generation failed: {e}")
            raise
    
    def _update_conversation_memory(self, context_key: str, query: str, response: str):
        """Update conversation memory for context"""
        
        if context_key not in self.conversation_memory:
            self.conversation_memory[context_key] = []
        
        self.conversation_memory[context_key].append({
            'query': query,
            'response': response[:500],  # Store truncated response
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 10 exchanges
        if len(self.conversation_memory[context_key]) > 10:
            self.conversation_memory[context_key] = self.conversation_memory[context_key][-10:]
    
    def _format_enhanced_sources(self, chunks: List[Dict], query_analysis: Dict) -> List[Dict]:
        """Format sources with enhanced metadata"""
        
        sources = []
        for i, chunk in enumerate(chunks):
            source = {
                'id': f"source_{i}",
                'title': chunk.get('filename', 'Unknown Document'),
                'snippet': self._generate_smart_snippet(chunk.get('text', ''), query_analysis),
                'relevance_score': round(chunk.get('final_score', chunk.get('score', 0)), 3),
                'chunk_index': chunk.get('chunk_index', 0),
                'filename': chunk.get('filename', 'Unknown'),
                'domain_match': query_analysis.get('domain', 'general'),
                'search_query': chunk.get('search_query', ''),
                'metadata': chunk.get('metadata', {})
            }
            sources.append(source)
        
        return sources
    
    def _generate_smart_snippet(self, text: str, query_analysis: Dict) -> str:
        """Generate intelligent snippet based on query analysis"""
        
        if not text:
            return "No content available"
        
        if len(text) <= 200:
            return text
        
        key_concepts = query_analysis.get('key_concepts', [])
        
        # Find the best sentence that contains key concepts
        sentences = text.split('. ')
        best_sentence = ""
        best_score = 0
        
        for sentence in sentences:
            score = sum(1 for concept in key_concepts if concept in sentence.lower())
            if score > best_score:
                best_score = score
                best_sentence = sentence
        
        if best_sentence and best_score > 0:
            # Expand context around the best sentence
            sentence_index = sentences.index(best_sentence)
            start_idx = max(0, sentence_index - 1)
            end_idx = min(len(sentences), sentence_index + 2)
            context_sentences = sentences[start_idx:end_idx]
            result = '. '.join(context_sentences)
            
            if len(result) <= 300:
                return result
            else:
                return result[:297] + "..."
        
        # Fallback to beginning
        return text[:197] + "..." if len(text) > 200 else text


# Global instance
enhanced_rag_service = ContextualRAGService()