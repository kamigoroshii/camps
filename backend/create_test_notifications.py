"""
Create test notifications to verify frontend is working
"""
import sqlite3
import uuid
from datetime import datetime

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Get admin user ID
cursor.execute('SELECT id, username FROM users WHERE username = "admin"')
admin = cursor.fetchone()

if not admin:
    print('❌ Admin user not found!')
    conn.close()
    exit(1)

admin_id = admin[0]
print(f'✓ Found admin user: {admin[1]} (ID: {admin_id})')

# Create test notifications
test_notifications = [
    {
        'id': str(uuid.uuid4()),
        'user_id': admin_id,
        'title': '🎉 Test Notification - Scholarship Approved',
        'message': 'Congratulations! Your scholarship application #TEST001 has been approved by the admin. The review comments indicate excellent academic performance.',
        'notification_type': 'in_app',
        'is_read': False,
        'request_id': None,
        'sent_at': datetime.now().isoformat(),
        'read_at': None
    },
    {
        'id': str(uuid.uuid4()),
        'user_id': admin_id,
        'title': 'Document Verification Complete',
        'message': 'Your documents for scholarship application #TEST002 have been verified. Please check the application status in your dashboard.',
        'notification_type': 'in_app',
        'is_read': False,
        'request_id': None,
        'sent_at': datetime.now().isoformat(),
        'read_at': None
    },
    {
        'id': str(uuid.uuid4()),
        'user_id': admin_id,
        'title': 'New Scholarship Application Submitted',
        'message': 'Your scholarship application #TEST003 has been successfully submitted and is pending admin review.',
        'notification_type': 'in_app',
        'is_read': True,
        'request_id': None,
        'sent_at': datetime.now().isoformat(),
        'read_at': datetime.now().isoformat()
    }
]

# Insert notifications
for notif in test_notifications:
    cursor.execute('''
        INSERT INTO notifications 
        (id, user_id, title, message, notification_type, is_read, request_id, sent_at, read_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        notif['id'],
        notif['user_id'],
        notif['title'],
        notif['message'],
        notif['notification_type'],
        notif['is_read'],
        notif['request_id'],
        notif['sent_at'],
        notif['read_at']
    ))
    status = '✓ Read' if notif['is_read'] else '○ Unread'
    print(f'{status} Created: {notif["title"]}')

conn.commit()
conn.close()

print(f'\n✓ Successfully created {len(test_notifications)} test notifications!')
print('🔄 Refresh your notifications page to see them!')
