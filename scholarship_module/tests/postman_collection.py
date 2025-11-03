"""
Postman Collection for Scholarship Verification Module
Import this into Postman or use with Newman CLI
"""

POSTMAN_COLLECTION = {
    "info": {
        "name": "Scholarship Verification API",
        "description": "Complete API test collection for scholarship verification module",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "base_url",
            "value": "http://localhost:8001",
            "type": "string"
        },
        {
            "key": "application_id",
            "value": "1",
            "type": "string"
        }
    ],
    "item": [
        {
            "name": "Health Check",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/",
                    "host": ["{{base_url}}"],
                    "path": [""]
                }
            }
        },
        {
            "name": "Submit Application",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "if (pm.response.code === 201) {",
                            "    var jsonData = pm.response.json();",
                            "    pm.collectionVariables.set('application_id', jsonData.application_id);",
                            "}"
                        ]
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [],
                "body": {
                    "mode": "formdata",
                    "formdata": [
                        {"key": "full_name", "value": "Test Student", "type": "text"},
                        {"key": "student_id", "value": "STU001", "type": "text"},
                        {"key": "email", "value": "test@university.edu", "type": "text"},
                        {"key": "department", "value": "Computer Science", "type": "text"},
                        {"key": "scholarship_type", "value": "Merit-Based", "type": "text"},
                        {"key": "amount_requested", "value": "5000", "type": "text"},
                        {"key": "reason", "value": "Academic excellence", "type": "text"}
                    ]
                },
                "url": {
                    "raw": "{{base_url}}/api/submit-application",
                    "host": ["{{base_url}}"],
                    "path": ["api", "submit-application"]
                }
            }
        },
        {
            "name": "Upload Document",
            "request": {
                "method": "POST",
                "header": [],
                "body": {
                    "mode": "formdata",
                    "formdata": [
                        {"key": "document_type", "value": "ID Card", "type": "text"},
                        {"key": "file", "type": "file", "src": "/path/to/test/document.jpg"}
                    ]
                },
                "url": {
                    "raw": "{{base_url}}/api/upload-document/{{application_id}}",
                    "host": ["{{base_url}}"],
                    "path": ["api", "upload-document", "{{application_id}}"]
                }
            }
        },
        {
            "name": "Verify Application",
            "request": {
                "method": "POST",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/verify-application/{{application_id}}",
                    "host": ["{{base_url}}"],
                    "path": ["api", "verify-application", "{{application_id}}"]
                }
            }
        },
        {
            "name": "Get Application",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/application/{{application_id}}",
                    "host": ["{{base_url}}"],
                    "path": ["api", "application", "{{application_id}}"]
                }
            }
        },
        {
            "name": "Get All Applications",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/applications",
                    "host": ["{{base_url}}"],
                    "path": ["api", "applications"]
                }
            }
        },
        {
            "name": "Get Pending Reviews",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/applications/pending-review",
                    "host": ["{{base_url}}"],
                    "path": ["api", "applications", "pending-review"]
                }
            }
        },
        {
            "name": "Admin Review - Approve",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"application_id\": {{application_id}},\n    \"decision\": \"approved\",\n    \"comments\": \"All requirements met\"\n}"
                },
                "url": {
                    "raw": "{{base_url}}/api/admin-review",
                    "host": ["{{base_url}}"],
                    "path": ["api", "admin-review"]
                }
            }
        },
        {
            "name": "Admin Review - Reject",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"}
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"application_id\": {{application_id}},\n    \"decision\": \"rejected\",\n    \"comments\": \"Incomplete documentation\"\n}"
                },
                "url": {
                    "raw": "{{base_url}}/api/admin-review",
                    "host": ["{{base_url}}"],
                    "path": ["api", "admin-review"]
                }
            }
        }
    ]
}

if __name__ == "__main__":
    import json
    with open("scholarship_api.postman_collection.json", "w") as f:
        json.dump(POSTMAN_COLLECTION, f, indent=2)
    print("✅ Postman collection exported to: scholarship_api.postman_collection.json")
    print("Import this file into Postman to test the API")
