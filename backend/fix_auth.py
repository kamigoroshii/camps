import re

# Read the file
with open('app/api/v1/endpoints/scholarship_verification.py', 'r') as f:
    content = f.read()

# Replace all remaining authentication patterns
content = re.sub(r'current_user: User = Depends\(get_current_user\)', 'current_user: dict = Depends(get_current_user)', content)
content = re.sub(r'current_user\.role\.value', 'current_user.get("role")', content)
content = re.sub(r'current_user\.id(?!\w)', 'int(current_user.get("sub"))', content)

# Write back
with open('app/api/v1/endpoints/scholarship_verification.py', 'w') as f:
    f.write(content)

print('Updated all authentication patterns')