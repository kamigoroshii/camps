import sqlite3
import json

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

print("=" * 80)
print("OCR AND VERIFICATION CHECK")
print("=" * 80)

# Get documents with their OCR text
cursor.execute("""
    SELECT 
        d.id, 
        d.document_type, 
        d.is_verified, 
        d.ocr_text,
        sr.verification_score,
        sr.request_data
    FROM documents d
    LEFT JOIN service_requests sr ON d.request_id = sr.id
    ORDER BY d.created_at DESC
    LIMIT 5
""")

docs = cursor.fetchall()

if not docs:
    print("❌ No documents found!")
else:
    for doc in docs:
        doc_id, doc_type, is_verified, ocr_text, ver_score, request_data = doc
        print(f"\n📄 Document: {doc_type}")
        print(f"   ID: {doc_id[:16]}...")
        print(f"   Verified: {'✅ YES' if is_verified else '❌ NO'}")
        print(f"   Verification Score: {ver_score}")
        
        if ocr_text:
            print(f"   OCR Text Length: {len(ocr_text)} chars")
            print(f"   OCR Text Preview: {ocr_text[:200]}...")
        else:
            print(f"   ❌ NO OCR TEXT FOUND!")
        
        # Check verification results in request_data
        if request_data:
            try:
                data = json.loads(request_data)
                ver_results = data.get('verification_results', {})
                if doc_type in ver_results:
                    result = ver_results[doc_type]
                    print(f"   Verification Results Found:")
                    print(f"     - OCR Confidence: {result.get('ocr_confidence', 'N/A')}")
                    print(f"     - Overall Confidence: {result.get('overall_confidence', 'N/A')}")
                    print(f"     - Identity Check: {result.get('identity_check', {}).get('confidence', 'N/A')}")
                    print(f"     - Authenticity Check: {result.get('authenticity_check', {}).get('confidence', 'N/A')}")
                else:
                    print(f"   ⚠️  No verification results for this document type")
            except:
                print(f"   ⚠️  Could not parse request_data")
        print("-" * 80)

conn.close()

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total documents checked: {len(docs)}")
docs_with_ocr = sum(1 for d in docs if d[3])
docs_verified = sum(1 for d in docs if d[2])
print(f"Documents with OCR text: {docs_with_ocr}/{len(docs)}")
print(f"Documents verified: {docs_verified}/{len(docs)}")

if docs_with_ocr == 0:
    print("\n⚠️  WARNING: No documents have OCR text!")
    print("This suggests OCR is NOT running during upload.")
elif docs_with_ocr < len(docs):
    print(f"\n⚠️  WARNING: Only {docs_with_ocr} out of {len(docs)} documents have OCR text!")
else:
    print("\n✅ All documents have OCR text - OCR is working!")
