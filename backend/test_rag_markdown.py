#!/usr/bin/env python3
"""
Test script to demonstrate improved RAG markdown formatting
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_service import rag_service

async def test_markdown_formatting():
    """Test the markdown formatting of RAG responses"""
    
    # Mock context chunks (simulating what would come from vector store)
    mock_chunks = [
        {
            'filename': 'Campus Handbook.pdf',
            'chunk_index': 0,
            'text': '''Student Services Information
ACADEMIC SUPPORT SERVICES
1. Library Services
   - Digital resources available 24/7
   - Research assistance by appointment
   - Group study rooms bookable online
2. Tutoring Center
   - Free tutoring for all subjects
   - Peer tutoring programs
   - Online tutoring sessions available
3. Career Services
   - Resume writing workshops
   - Interview preparation
   - Job placement assistance
IMPORTANT: All services require valid student ID''',
            'score': 0.85
        },
        {
            'filename': 'Academic Policies.pdf',
            'chunk_index': 2,
            'text': '''GRADING POLICY
Grade Scale:
A: 90-100%
B: 80-89%
C: 70-79%
D: 60-69%
F: Below 60%

ATTENDANCE REQUIREMENTS
• Students must maintain 80% attendance
• Medical leave requires documentation
• Religious holidays are excused absences
• Make-up exams available for excused absences only''',
            'score': 0.72
        }
    ]
    
    print("=== Testing RAG Markdown Formatting ===\n")
    
    # Test 1: Simple query
    print("1. Testing simple query response:")
    response1 = rag_service._generate_simple_response("What services are available?", mock_chunks)
    print(response1)
    print("\n" + "="*60 + "\n")
    
    # Test 2: No documents found
    print("2. Testing no documents response:")
    response2 = rag_service._generate_simple_response("What about parking?", [])
    print(response2)
    print("\n" + "="*60 + "\n")
    
    # Test 3: Snippet formatting
    print("3. Testing snippet formatting:")
    test_text = '''STUDENT HANDBOOK SECTION 4: ACADEMIC POLICIES
1. Course Registration Process
2. Add/Drop Procedures
3. Withdrawal Policies
• Complete withdrawal requires academic advisor approval
• Partial withdrawal affects financial aid
• Medical withdrawal requires health center documentation'''
    
    formatted = rag_service._format_snippet_as_markdown(test_text)
    print("Original text:")
    print(test_text)
    print("\nFormatted markdown:")
    print(formatted)

if __name__ == "__main__":
    asyncio.run(test_markdown_formatting())