import sqlite3

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Count notifications
cursor.execute('SELECT COUNT(*) FROM notifications')
total = cursor.fetchone()[0]
print(f'Total notifications in database: {total}')

# Get all notifications
cursor.execute('''
    SELECT id, user_id, title, message, is_read, sent_at 
    FROM notifications 
    ORDER BY sent_at DESC
''')
rows = cursor.fetchall()

print('\nNotifications:')
if rows:
    for i, row in enumerate(rows, 1):
        print(f'\n{i}. ID: {row[0]}')
        print(f'   User ID: {row[1]}')
        print(f'   Title: {row[2]}')
        print(f'   Message: {row[3][:80]}...' if len(row[3]) > 80 else f'   Message: {row[3]}')
        print(f'   Read: {row[4]}')
        print(f'   Sent: {row[5]}')
else:
    print('No notifications found in database')

# Get user count
cursor.execute('SELECT COUNT(*) FROM users')
user_count = cursor.fetchone()[0]
print(f'\nTotal users: {user_count}')

# Get logged in user info
cursor.execute('SELECT id, username, email FROM users WHERE username = "admin"')
admin = cursor.fetchone()
if admin:
    print(f'\nAdmin user: {admin}')
    # Check notifications for this user
    cursor.execute('SELECT COUNT(*) FROM notifications WHERE user_id = ?', (admin[0],))
    admin_notif_count = cursor.fetchone()[0]
    print(f'Notifications for admin: {admin_notif_count}')

conn.close()
