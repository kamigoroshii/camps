#!/usr/bin/env python3
"""
Test script for the new Enhanced RAG service
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_enhanced_rag():
    """Test the enhanced RAG service functionality"""
    
    print("🔧 Testing Enhanced RAG Service...")
    
    try:
        # Import the enhanced service
        from app.services.rag_service_new import enhanced_rag_service
        print("✅ Enhanced RAG service imported successfully")
        
        # Test initialization
        await enhanced_rag_service.initialize()
        print("✅ RAG service initialized")
        
        # Test query analysis
        test_query = "How do I apply for scholarships?"
        analysis = await enhanced_rag_service._analyze_query(test_query, 'english')
        print(f"✅ Query analysis: {analysis}")
        
        # Test fallback response (when no documents are available)
        mock_context_chunks = []
        fallback_response = enhanced_rag_service._generate_enhanced_fallback_response(
            query=test_query,
            query_analysis=analysis,
            context_chunks=mock_context_chunks,
            conversation_history=[],
            language='english'
        )
        print("✅ Fallback response generated:")
        print(f"📄 Response length: {len(fallback_response)} characters")
        print("="*60)
        print(fallback_response[:300] + "..." if len(fallback_response) > 300 else fallback_response)
        print("="*60)
        
        print("🎉 All tests passed! Enhanced RAG service is working properly.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_enhanced_rag())