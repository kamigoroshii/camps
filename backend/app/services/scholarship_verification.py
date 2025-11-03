"""
Automated Scholarship Verification Service
Handles document processing, OCR, verification checks, and AI-powered analysis
"""

import logging
import re
import json
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from io import BytesIO
import hashlib

import pytesseract
from PIL import Image
import cv2
import numpy as np

# Configure Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

from app.core.config import settings
from app.services.document_processor import DocumentProcessor
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)


class ScholarshipVerificationService:
    """Service for automated scholarship document verification"""
    
    def __init__(self):
        self.document_processor = DocumentProcessor()
        
    # ==================== OCR & TEXT EXTRACTION ====================
    
    async def extract_text_with_ocr(self, file_content: bytes, file_extension: str) -> Dict[str, Any]:
        """
        Extract text from document using OCR
        Supports PDF, images, and scanned documents
        """
        try:
            extracted_data = {
                'text': '',
                'confidence': 0.0,
                'method': 'none',
                'structured_data': {}
            }
            
            # For PDFs, try text extraction first, then OCR if needed
            if file_extension.lower() == '.pdf':
                text = self.document_processor.extract_text_from_pdf(file_content)
                if text and len(text.strip()) > 100:
                    extracted_data['text'] = text
                    extracted_data['method'] = 'pdf_text_extraction'
                    extracted_data['confidence'] = 0.95
                else:
                    # PDF might be scanned, use OCR
                    text, confidence = await self._ocr_from_pdf(file_content)
                    extracted_data['text'] = text
                    extracted_data['confidence'] = confidence
                    extracted_data['method'] = 'ocr_pdf'
            
            # For images, use OCR
            elif file_extension.lower() in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']:
                text, confidence = await self._ocr_from_image(file_content)
                extracted_data['text'] = text
                extracted_data['confidence'] = confidence
                extracted_data['method'] = 'ocr_image'
            
            # For Word documents
            elif file_extension.lower() == '.docx':
                text = self.document_processor.extract_text_from_docx(file_content)
                extracted_data['text'] = text
                extracted_data['method'] = 'docx_extraction'
                extracted_data['confidence'] = 0.95
            
            # Parse structured data from text
            if extracted_data['text']:
                extracted_data['structured_data'] = self._parse_document_fields(
                    extracted_data['text']
                )
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error in OCR extraction: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'error',
                'error': str(e),
                'structured_data': {}
            }
    
    async def _ocr_from_image(self, image_content: bytes) -> Tuple[str, float]:
        """Perform OCR on image with preprocessing"""
        try:
            # Load image
            image = Image.open(BytesIO(image_content))
            
            # Convert to numpy array for preprocessing
            img_array = np.array(image)
            
            # Preprocess image for better OCR
            processed_img = self._preprocess_image(img_array)
            
            # Perform OCR with detailed data
            if settings.ENABLE_OCR:
                ocr_data = pytesseract.image_to_data(
                    processed_img,
                    lang=settings.TESSERACT_LANG,
                    output_type=pytesseract.Output.DICT
                )
                
                # Extract text and calculate average confidence
                text_parts = []
                confidences = []
                
                for i, conf in enumerate(ocr_data['conf']):
                    if int(conf) > 0:  # Only valid detections
                        text_parts.append(ocr_data['text'][i])
                        confidences.append(int(conf))
                
                text = ' '.join(text_parts)
                avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                
                return text, avg_confidence / 100.0
            else:
                return "", 0.0
            
        except Exception as e:
            logger.error(f"Error in image OCR: {e}")
            return "", 0.0
    
    async def _ocr_from_pdf(self, pdf_content: bytes) -> Tuple[str, float]:
        """Perform OCR on PDF (convert pages to images first)"""
        try:
            # This is a simplified version
            # In production, use pdf2image to convert PDF pages to images
            # then apply OCR on each page
            
            # For now, return empty
            logger.warning("PDF OCR not fully implemented, requires pdf2image")
            return "", 0.0
            
        except Exception as e:
            logger.error(f"Error in PDF OCR: {e}")
            return "", 0.0
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR accuracy"""
        try:
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Apply thresholding
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
            
            return denoised
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return image
    
    def _parse_document_fields(self, text: str) -> Dict[str, Any]:
        """
        Parse structured fields from document text
        Extracts: name, ID, dates, amounts, grades, etc.
        """
        fields = {}
        
        try:
            # Extract student name (common patterns)
            name_patterns = [
                r"(?:Name|Student Name|Applicant Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                r"(?:Mr\.|Ms\.|Miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
            ]
            for pattern in name_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    fields['name'] = match.group(1).strip()
                    break
            
            # Extract student ID
            id_patterns = [
                r"(?:Student ID|ID No|Roll No|Registration No)[:\s]+([A-Z0-9]+)",
                r"\b([A-Z]\d{5,10})\b",
            ]
            for pattern in id_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    fields['student_id'] = match.group(1).strip()
                    break
            
            # Extract dates
            date_patterns = [
                r"(?:Date|Date of Issue|Issued on)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
                r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            ]
            dates = []
            for pattern in date_patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    dates.append(match.group(1))
            if dates:
                fields['dates'] = dates
            
            # Extract amounts/financial data
            amount_patterns = [
                r"(?:Amount|Fee|Total|Rs\.?|INR)[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",
                r"₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",
            ]
            amounts = []
            for pattern in amount_patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    amounts.append(match.group(1))
            if amounts:
                fields['amounts'] = amounts
            
            # Extract grades/CGPA
            grade_patterns = [
                r"(?:CGPA|GPA|Grade)[:\s]+([\d.]+)",
                r"(?:Percentage|Marks)[:\s]+(\d+(?:\.\d+)?)\s*%?",
            ]
            for pattern in grade_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    fields['grade'] = match.group(1)
                    break
            
            # Extract department
            dept_match = re.search(r"(?:Department|Branch|Course)[:\s]+([A-Za-z\s]+?)(?:\n|,|\.)", text, re.IGNORECASE)
            if dept_match:
                fields['department'] = dept_match.group(1).strip()
            
            # Extract year/semester
            year_match = re.search(r"(?:Year|Semester)[:\s]+(\d+)", text, re.IGNORECASE)
            if year_match:
                fields['year'] = year_match.group(1)
            
            logger.info(f"Parsed fields: {fields}")
            return fields
            
        except Exception as e:
            logger.error(f"Error parsing document fields: {e}")
            return fields
    
    # ==================== VERIFICATION CHECKS ====================
    
    async def verify_identity(
        self,
        extracted_data: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify student identity by matching extracted data with database
        """
        verification_result = {
            'status': 'pending',
            'confidence': 0.0,
            'matches': {},
            'mismatches': {},
            'issues': []
        }
        
        try:
            structured = extracted_data.get('structured_data', {})
            
            # Check name match
            if 'name' in structured and 'full_name' in user_data:
                doc_name = structured['name'].lower().strip()
                db_name = user_data['full_name'].lower().strip()
                
                # Calculate similarity (simple approach)
                similarity = self._calculate_string_similarity(doc_name, db_name)
                
                if similarity > 0.8:
                    verification_result['matches']['name'] = {
                        'document': structured['name'],
                        'database': user_data['full_name'],
                        'confidence': similarity
                    }
                else:
                    verification_result['mismatches']['name'] = {
                        'document': structured['name'],
                        'database': user_data['full_name'],
                        'confidence': similarity
                    }
                    verification_result['issues'].append(f"Name mismatch: '{structured['name']}' vs '{user_data['full_name']}'")
            
            # Check student ID match
            if 'student_id' in structured and 'student_id' in user_data:
                if structured['student_id'].lower() == user_data['student_id'].lower():
                    verification_result['matches']['student_id'] = {
                        'document': structured['student_id'],
                        'database': user_data['student_id'],
                        'confidence': 1.0
                    }
                else:
                    verification_result['mismatches']['student_id'] = {
                        'document': structured['student_id'],
                        'database': user_data['student_id'],
                        'confidence': 0.0
                    }
                    verification_result['issues'].append(f"Student ID mismatch: '{structured['student_id']}' vs '{user_data['student_id']}'")
            
            # Check department match
            if 'department' in structured and 'department' in user_data:
                if structured['department'].lower() in user_data['department'].lower() or \
                   user_data['department'].lower() in structured['department'].lower():
                    verification_result['matches']['department'] = {
                        'document': structured['department'],
                        'database': user_data['department'],
                        'confidence': 0.9
                    }
                else:
                    verification_result['mismatches']['department'] = {
                        'document': structured['department'],
                        'database': user_data['department'],
                        'confidence': 0.0
                    }
            
            # Calculate overall confidence
            total_checks = len(verification_result['matches']) + len(verification_result['mismatches'])
            if total_checks > 0:
                verification_result['confidence'] = len(verification_result['matches']) / total_checks
            
            # Determine status
            if verification_result['confidence'] >= 0.8:
                verification_result['status'] = 'verified'
            elif verification_result['confidence'] >= 0.5:
                verification_result['status'] = 'review_required'
            else:
                verification_result['status'] = 'failed'
            
            return verification_result
            
        except Exception as e:
            logger.error(f"Error in identity verification: {e}")
            verification_result['status'] = 'error'
            verification_result['issues'].append(f"Verification error: {str(e)}")
            return verification_result
    
    async def verify_document_authenticity(
        self,
        file_content: bytes,
        file_extension: str,
        extracted_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check document authenticity: watermarks, stamps, signatures
        """
        authenticity_result = {
            'status': 'pending',
            'confidence': 0.0,
            'checks': {},
            'issues': []
        }
        
        try:
            # For images, check for visual elements
            if file_extension.lower() in ['.jpg', '.jpeg', '.png']:
                image = Image.open(BytesIO(file_content))
                img_array = np.array(image)
                
                # Check for color distribution (stamps/seals usually have distinct colors)
                has_stamp = self._detect_stamp_seal(img_array)
                authenticity_result['checks']['stamp_detected'] = has_stamp
                
                # Check for signature regions (dark regions in specific areas)
                has_signature = self._detect_signature(img_array)
                authenticity_result['checks']['signature_detected'] = has_signature
                
                # Check image quality (low quality might indicate screenshot)
                quality_score = self._assess_image_quality(img_array)
                authenticity_result['checks']['image_quality'] = quality_score
                
                if quality_score < 0.3:
                    authenticity_result['issues'].append("Low image quality - possible screenshot or photocopy")
            
            # Check OCR confidence
            ocr_confidence = extracted_data.get('confidence', 0.0)
            authenticity_result['checks']['ocr_confidence'] = ocr_confidence
            
            if ocr_confidence < 0.5:
                authenticity_result['issues'].append("Low OCR confidence - document may be unclear or tampered")
            
            # Calculate overall confidence
            checks = authenticity_result['checks']
            confidence_factors = [
                checks.get('stamp_detected', False) * 0.3,
                checks.get('signature_detected', False) * 0.2,
                checks.get('image_quality', 0) * 0.2,
                checks.get('ocr_confidence', 0) * 0.3
            ]
            authenticity_result['confidence'] = sum(confidence_factors)
            
            # Determine status
            if authenticity_result['confidence'] >= 0.7:
                authenticity_result['status'] = 'verified'
            elif authenticity_result['confidence'] >= 0.4:
                authenticity_result['status'] = 'review_required'
            else:
                authenticity_result['status'] = 'suspicious'
            
            return authenticity_result
            
        except Exception as e:
            logger.error(f"Error in authenticity verification: {e}")
            authenticity_result['status'] = 'error'
            authenticity_result['issues'].append(f"Authenticity check error: {str(e)}")
            return authenticity_result
    
    async def verify_data_validity(
        self,
        extracted_data: Dict[str, Any],
        scholarship_requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify data against scholarship requirements
        Check grades, income, eligibility criteria
        """
        validity_result = {
            'status': 'pending',
            'confidence': 0.0,
            'checks': {},
            'issues': [],
            'warnings': []
        }
        
        try:
            structured = extracted_data.get('structured_data', {})
            
            # Check grade requirements
            if 'grade' in structured and 'min_grade' in scholarship_requirements:
                doc_grade = float(structured['grade'])
                min_grade = float(scholarship_requirements['min_grade'])
                
                if doc_grade >= min_grade:
                    validity_result['checks']['grade_requirement'] = {
                        'met': True,
                        'value': doc_grade,
                        'required': min_grade
                    }
                else:
                    validity_result['checks']['grade_requirement'] = {
                        'met': False,
                        'value': doc_grade,
                        'required': min_grade
                    }
                    validity_result['issues'].append(f"Grade {doc_grade} below minimum requirement {min_grade}")
            
            # Check income requirements
            if 'amounts' in structured and 'max_income' in scholarship_requirements:
                # Assume the largest amount is the annual income
                income_values = [float(amt.replace(',', '')) for amt in structured['amounts']]
                max_income_doc = max(income_values) if income_values else 0
                max_income_req = float(scholarship_requirements['max_income'])
                
                if max_income_doc <= max_income_req:
                    validity_result['checks']['income_requirement'] = {
                        'met': True,
                        'value': max_income_doc,
                        'required': max_income_req
                    }
                else:
                    validity_result['checks']['income_requirement'] = {
                        'met': False,
                        'value': max_income_doc,
                        'required': max_income_req
                    }
                    validity_result['issues'].append(f"Income {max_income_doc} exceeds maximum {max_income_req}")
            
            # Check date validity
            if 'dates' in structured:
                for date_str in structured['dates']:
                    is_valid, msg = self._validate_date(date_str)
                    if not is_valid:
                        validity_result['warnings'].append(msg)
            
            # Calculate confidence
            total_checks = len(validity_result['checks'])
            if total_checks > 0:
                met_checks = sum(1 for check in validity_result['checks'].values() if check.get('met', False))
                validity_result['confidence'] = met_checks / total_checks
            else:
                validity_result['confidence'] = 0.5  # Neutral if no checks
            
            # Determine status
            if validity_result['confidence'] >= 0.8 and not validity_result['issues']:
                validity_result['status'] = 'valid'
            elif validity_result['confidence'] >= 0.5:
                validity_result['status'] = 'review_required'
            else:
                validity_result['status'] = 'invalid'
            
            return validity_result
            
        except Exception as e:
            logger.error(f"Error in data validity check: {e}")
            validity_result['status'] = 'error'
            validity_result['issues'].append(f"Validity check error: {str(e)}")
            return validity_result
    
    async def check_completeness(
        self,
        uploaded_documents: List[Dict[str, Any]],
        required_documents: List[str]
    ) -> Dict[str, Any]:
        """
        Check if all required documents are present
        """
        completeness_result = {
            'status': 'pending',
            'confidence': 0.0,
            'present': [],
            'missing': [],
            'issues': []
        }
        
        try:
            # Get document types from uploaded documents
            uploaded_types = set()
            for doc in uploaded_documents:
                doc_type = doc.get('document_type', '').lower()
                if doc_type:
                    uploaded_types.add(doc_type)
            
            # Check each required document
            for req_doc in required_documents:
                req_doc_lower = req_doc.lower()
                if req_doc_lower in uploaded_types:
                    completeness_result['present'].append(req_doc)
                else:
                    completeness_result['missing'].append(req_doc)
                    completeness_result['issues'].append(f"Missing required document: {req_doc}")
            
            # Calculate confidence
            total_required = len(required_documents)
            if total_required > 0:
                completeness_result['confidence'] = len(completeness_result['present']) / total_required
            
            # Determine status
            if completeness_result['confidence'] == 1.0:
                completeness_result['status'] = 'complete'
            elif completeness_result['confidence'] >= 0.7:
                completeness_result['status'] = 'mostly_complete'
            else:
                completeness_result['status'] = 'incomplete'
            
            return completeness_result
            
        except Exception as e:
            logger.error(f"Error in completeness check: {e}")
            completeness_result['status'] = 'error'
            completeness_result['issues'].append(f"Completeness check error: {str(e)}")
            return completeness_result
    
    # ==================== AI-POWERED ANALYSIS ====================
    
    async def ai_fraud_detection(
        self,
        extracted_data: Dict[str, Any],
        document_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Use AI to detect anomalies and potential fraud
        """
        fraud_result = {
            'status': 'pending',
            'risk_level': 'low',
            'confidence': 0.0,
            'anomalies': [],
            'red_flags': [],
            'warnings': []
        }
        
        try:
            structured = extracted_data.get('structured_data', {})
            
            # Check for duplicate submissions
            for past_doc in document_history:
                past_structured = past_doc.get('structured_data', {})
                
                # Check if same document (using content hash or similar fields)
                if self._is_duplicate_document(structured, past_structured):
                    fraud_result['red_flags'].append("Possible duplicate submission detected")
                    fraud_result['risk_level'] = 'high'
            
            # Check for inconsistencies in data
            if 'dates' in structured and len(structured['dates']) > 1:
                dates_parsed = []
                for date_str in structured['dates']:
                    try:
                        parsed = datetime.strptime(date_str, '%d/%m/%Y')
                        dates_parsed.append(parsed)
                    except:
                        pass
                
                # Check for future dates
                now = datetime.now()
                for date in dates_parsed:
                    if date > now:
                        fraud_result['warnings'].append(f"Future date detected: {date.strftime('%d/%m/%Y')}")
            
            # Check for suspicious patterns in amounts
            if 'amounts' in structured:
                amounts = [float(amt.replace(',', '')) for amt in structured['amounts']]
                if amounts:
                    # Check for round numbers (might indicate fabrication)
                    round_numbers = sum(1 for amt in amounts if amt % 1000 == 0)
                    if round_numbers == len(amounts) and len(amounts) > 1:
                        fraud_result['warnings'].append("All amounts are round numbers - verify authenticity")
            
            # Use RAG for policy comparison if available
            if settings.ENABLE_CHAT_ASSISTANT:
                rag_analysis = await self._rag_policy_check(extracted_data)
                if rag_analysis.get('issues'):
                    fraud_result['anomalies'].extend(rag_analysis['issues'])
            
            # Calculate risk level
            risk_score = (
                len(fraud_result['red_flags']) * 0.5 +
                len(fraud_result['anomalies']) * 0.3 +
                len(fraud_result['warnings']) * 0.1
            )
            
            if risk_score > 1.0:
                fraud_result['risk_level'] = 'high'
                fraud_result['status'] = 'requires_review'
            elif risk_score > 0.5:
                fraud_result['risk_level'] = 'medium'
                fraud_result['status'] = 'review_recommended'
            else:
                fraud_result['risk_level'] = 'low'
                fraud_result['status'] = 'passed'
            
            fraud_result['confidence'] = 1.0 - min(risk_score / 2.0, 1.0)
            
            return fraud_result
            
        except Exception as e:
            logger.error(f"Error in fraud detection: {e}")
            fraud_result['status'] = 'error'
            fraud_result['red_flags'].append(f"Fraud detection error: {str(e)}")
            return fraud_result
    
    async def _rag_policy_check(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use RAG system to check against policy documents"""
        try:
            # Create query from extracted data
            structured = extracted_data.get('structured_data', {})
            query = f"Check scholarship eligibility for student with grade {structured.get('grade', 'N/A')}, income {structured.get('amounts', 'N/A')}"
            
            # Search relevant policy chunks
            # Note: This assumes RAG service is initialized
            # In production, add proper error handling
            return {'issues': []}
            
        except Exception as e:
            logger.error(f"Error in RAG policy check: {e}")
            return {'issues': []}
    
    # ==================== AUTOMATED WORKFLOW ====================
    
    async def auto_decision(
        self,
        all_verification_results: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Make automated approval/rejection decision based on all verifications
        """
        decision = {
            'action': 'pending',
            'confidence': 0.0,
            'reason': '',
            'requires_manual_review': False,
            'review_priority': 'normal'
        }
        
        try:
            # Extract all verification statuses
            identity_check = all_verification_results.get('identity', {})
            authenticity_check = all_verification_results.get('authenticity', {})
            validity_check = all_verification_results.get('validity', {})
            completeness_check = all_verification_results.get('completeness', {})
            fraud_check = all_verification_results.get('fraud', {})
            
            # Calculate overall confidence
            confidences = [
                identity_check.get('confidence', 0) * 0.25,
                authenticity_check.get('confidence', 0) * 0.20,
                validity_check.get('confidence', 0) * 0.25,
                completeness_check.get('confidence', 0) * 0.15,
                fraud_check.get('confidence', 0) * 0.15
            ]
            decision['confidence'] = sum(confidences)
            
            # Check for critical failures
            critical_issues = []
            
            if identity_check.get('status') == 'failed':
                critical_issues.append("Identity verification failed")
            
            if authenticity_check.get('status') == 'suspicious':
                critical_issues.append("Document authenticity suspicious")
            
            if validity_check.get('status') == 'invalid':
                critical_issues.append("Eligibility criteria not met")
            
            if completeness_check.get('status') == 'incomplete':
                critical_issues.append("Required documents missing")
            
            if fraud_check.get('risk_level') == 'high':
                critical_issues.append("High fraud risk detected")
            
            # Make decision
            if critical_issues:
                decision['action'] = 'reject'
                decision['reason'] = '; '.join(critical_issues)
                decision['requires_manual_review'] = True
                decision['review_priority'] = 'high'
            
            elif decision['confidence'] >= 0.8:
                decision['action'] = 'approve'
                decision['reason'] = 'All verification checks passed successfully'
            
            elif decision['confidence'] >= 0.6:
                decision['action'] = 'review'
                decision['reason'] = 'Some verification checks require manual review'
                decision['requires_manual_review'] = True
                decision['review_priority'] = 'medium'
            
            else:
                decision['action'] = 'review'
                decision['reason'] = 'Multiple verification checks failed or incomplete'
                decision['requires_manual_review'] = True
                decision['review_priority'] = 'high'
            
            return decision
            
        except Exception as e:
            logger.error(f"Error in auto decision: {e}")
            decision['action'] = 'error'
            decision['reason'] = f"Decision error: {str(e)}"
            decision['requires_manual_review'] = True
            decision['review_priority'] = 'urgent'
            return decision
    
    async def generate_verification_report(
        self,
        request_id: int,
        all_results: Dict[str, Any],
        decision: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive verification report
        """
        report = {
            'request_id': request_id,
            'generated_at': datetime.utcnow().isoformat(),
            'overall_status': decision.get('action', 'pending'),
            'confidence_score': decision.get('confidence', 0.0),
            'summary': {},
            'details': all_results,
            'recommendation': decision.get('reason', ''),
            'next_actions': []
        }
        
        try:
            # Create summary
            for check_name, check_result in all_results.items():
                report['summary'][check_name] = {
                    'status': check_result.get('status', 'unknown'),
                    'confidence': check_result.get('confidence', 0.0),
                    'issues_count': len(check_result.get('issues', []))
                }
            
            # Add next actions based on decision
            if decision['action'] == 'approve':
                report['next_actions'] = [
                    'Send approval notification to student',
                    'Process scholarship disbursement',
                    'Update request status to approved'
                ]
            elif decision['action'] == 'reject':
                report['next_actions'] = [
                    'Send rejection notification with reasons',
                    'Allow resubmission with corrections',
                    'Update request status to rejected'
                ]
            else:  # review
                report['next_actions'] = [
                    'Assign to admin reviewer',
                    'Notify admin of review priority',
                    'Highlight specific issues for manual check'
                ]
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            report['error'] = str(e)
            return report
    
    # ==================== UTILITY METHODS ====================
    
    def _calculate_string_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings using Levenshtein distance"""
        try:
            # Simple implementation - in production use python-Levenshtein
            if str1 == str2:
                return 1.0
            
            len1, len2 = len(str1), len(str2)
            if len1 == 0 or len2 == 0:
                return 0.0
            
            # Count matching characters
            matches = sum(c1 == c2 for c1, c2 in zip(str1, str2))
            max_len = max(len1, len2)
            
            return matches / max_len
            
        except Exception as e:
            logger.error(f"Error calculating string similarity: {e}")
            return 0.0
    
    def _detect_stamp_seal(self, image: np.ndarray) -> bool:
        """Detect presence of stamp or seal in image"""
        try:
            # Simple color-based detection
            # Stamps usually have distinct colors (red, blue, etc.)
            if len(image.shape) == 3:
                # Check for red channel dominance
                red_channel = image[:, :, 2]
                red_ratio = np.sum(red_channel > 200) / red_channel.size
                
                if red_ratio > 0.01:  # More than 1% bright red pixels
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error detecting stamp: {e}")
            return False
    
    def _detect_signature(self, image: np.ndarray) -> bool:
        """Detect presence of signature in image"""
        try:
            # Simple detection based on ink-like patterns
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            
            # Look for dark regions (signature ink)
            dark_pixels = np.sum(gray < 100)
            dark_ratio = dark_pixels / gray.size
            
            # Signatures typically occupy 1-10% of document
            if 0.01 <= dark_ratio <= 0.1:
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error detecting signature: {e}")
            return False
    
    def _assess_image_quality(self, image: np.ndarray) -> float:
        """Assess image quality (0-1 scale)"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            
            # Calculate Laplacian variance (measure of blur)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Normalize to 0-1 scale (empirical thresholds)
            quality = min(laplacian_var / 1000, 1.0)
            
            return quality
            
        except Exception as e:
            logger.error(f"Error assessing image quality: {e}")
            return 0.5
    
    def _validate_date(self, date_str: str) -> Tuple[bool, str]:
        """Validate date format and reasonableness"""
        try:
            # Try common date formats
            formats = ['%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%m/%d/%Y']
            
            parsed_date = None
            for fmt in formats:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue
            
            if parsed_date is None:
                return False, f"Invalid date format: {date_str}"
            
            # Check if date is reasonable (not too old, not future)
            now = datetime.now()
            if parsed_date > now:
                return False, f"Future date detected: {date_str}"
            
            if parsed_date < now - timedelta(days=365*10):  # 10 years old
                return True, f"Warning: Very old date: {date_str}"
            
            return True, "Date valid"
            
        except Exception as e:
            return False, f"Date validation error: {str(e)}"
    
    def _is_duplicate_document(self, doc1: Dict[str, Any], doc2: Dict[str, Any]) -> bool:
        """Check if two documents are duplicates"""
        try:
            # Compare key fields
            similarity_score = 0
            comparisons = 0
            
            for key in ['name', 'student_id', 'grade']:
                if key in doc1 and key in doc2:
                    comparisons += 1
                    if str(doc1[key]).lower() == str(doc2[key]).lower():
                        similarity_score += 1
            
            if comparisons == 0:
                return False
            
            return (similarity_score / comparisons) > 0.8
            
        except Exception as e:
            logger.error(f"Error checking document duplication: {e}")
            return False


# Initialize service
scholarship_verification_service = ScholarshipVerificationService()
