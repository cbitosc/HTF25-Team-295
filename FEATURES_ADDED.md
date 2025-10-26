# New Features Added

## Summary
Three major features have been added to your chat application:
1. **@Mention Feature** - Highlight mentioned users
2. **Delete Message Feature** - Admin-only message deletion
3. **Chat Persistence** - All messages are saved to database and persist across page reloads

---

## 1. @Mention Feature

### How to Use:
- Type `@username` in your message to mention a user
- Mentioned users will be highlighted in **yellow**
- If you're mentioned, you'll see a 🔔 notification

### Technical Details:
- Mentions are extracted using regex pattern `@(\w+)`
- Mentioned usernames are stored in the database
- Highlights are displayed in yellow in the chat interface

---

## 2. Delete Message Feature (Admin Only)

### How to Use:
- **Only admins can delete messages**
- Hover over any message to see a delete button (trash icon)
- Click the delete button to remove the message
- Deleted messages are removed from the database

### Technical Details:
- Delete action requires admin privileges (`is_admin = 1`)
- Deletes are broadcast to all users in the room
- Messages are soft-deleted in the database (`is_deleted` flag)

### To Make a User Admin:
```sql
UPDATE users SET is_admin = 1 WHERE username = 'your_username';
```

---

## 3. Chat Persistence

### How It Works:
- All messages are saved to the SQLite database (`studychat.db`)
- When you reload the page, chat history is fetched from the database
- Messages include timestamps, file attachments, and mentions

### Database Schema Updates:
The `Message` model now includes:
- `file_url`, `filename`, `file_type`, `file_size` - For file attachments
- `mentioned_users` - Comma-separated list of mentioned users
- `is_deleted` - Soft delete flag
- `deleted_by` - Username who deleted the message

---

## Running the Application

### 1. Initialize Database (if not done):
```bash
cd HTF25-Team-295
python -m app.init_db
```

### 2. Start Backend Server:
```bash
python -m app.run_server
```

### 3. Start Frontend:
```bash
cd studyroom-frontend
npm run dev
```

---

## API Endpoints Added

### GET `/chat/history/{room_id}`
- Fetch chat history for a room
- Returns all non-deleted messages for the room
- Includes file metadata and mentions

### WebSocket Messages:
- `delete_message` - Admin can send this to delete a message
- `message_deleted` - Broadcast to all users when a message is deleted

---

## Files Modified

### Backend:
- `app/models.py` - Updated Message model with new fields
- `app/chat.py` - Added mention extraction, message persistence, delete handling
- `app/init_db.py` - Database initialization script

### Frontend:
- `studyroom-frontend/src/components/ChatRoom.jsx` - Added history fetching, mention highlighting, delete UI

---

## Testing the Features

### Test @Mention:
1. Join a room with username "Alice"
2. Type: `@Alice Hello!`
3. Alice should see the message with yellow highlighted mention

### Test Chat Persistence:
1. Send some messages in a room
2. Reload the page
3. Messages should still be there!

### Test Delete Message:
1. Make yourself admin: Set `is_admin = 1` in database
2. Hover over any message
3. Click the delete (trash) icon
4. Message disappears for all users

---

## Notes

- **Admin Feature**: To enable delete functionality, you need to set `is_admin = 1` in the users table
- **File Uploads**: Still works as before, files are now saved in the database too
- **Performance**: Database queries are optimized to only fetch non-deleted messages

---

## Database Migration

If you had an existing database, you'll need to run the init script:
```bash
python -m app.init_db
```

This will create/update the database schema with the new fields.

