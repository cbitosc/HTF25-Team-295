# New Admin Features

## Summary
Enhanced the chat application with admin capabilities and improved chat persistence:

1. **First user in room becomes admin**
2. **Admin can mute/unmute users**
3. **Admin can delete messages**
4. **Chat history loads on rejoin**
5. **Muted users cannot send messages**

---

## 1. Admin System

### How It Works:
- **First user** to enter a room automatically becomes the admin
- Admin status is stored in the database per room
- Admins get additional controls in the UI

### Admin Privileges:
- ✅ Delete any message in the room
- ✅ Mute users (prevent them from sending messages)
- ✅ Unmute users
- ✅ See delete button on hover when viewing messages

### UI Indicators:
- Admins will see mute/unmute buttons next to online users
- Admins will see delete button (trash icon) when hovering over messages
- No special indication needed - admins automatically get these controls

---

## 2. Mute/Unmute Feature

### How to Use (Admin Only):

1. Click the **Users icon** (👥) in the header to view online users
2. Find the user you want to mute/unmute
3. Click:
   - **🔇 (Mute)** - Prevents user from sending messages
   - **🔊 (Unmute)** - Allows user to send messages again

### How It Works:
- Muted users get an error message if they try to send messages
- Mute status is broadcast to all users in the room
- Mute status is saved in the database
- When muted user tries to send, they see: "You are muted and cannot send messages"

---

## 3. Chat History on Rejoin

### How It Works:
- When you join a room, you automatically receive all previous messages
- Messages are loaded from the database
- You see the full chat history, not just new messages
- Works seamlessly when you leave and rejoin

### Technical Details:
- Messages are saved to database when sent
- On WebSocket connection, history is fetched and sent to the client
- No manual refresh needed

---

## 4. Message Deletion (Admin Only)

### How to Use:
1. Hover over any message in the chat
2. A red **trash icon** appears (admin only)
3. Click to delete the message
4. Message disappears for all users

---

## Database Changes

### New Tables:
- `muted_users` - Tracks muted users per room

### Updated Tables:
- `rooms` - Added `admin_username` field

### Schema:
```sql
-- Rooms table
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY,
    name VARCHAR UNIQUE,
    admin_username VARCHAR  -- First user becomes admin
);

-- Muted users table
CREATE TABLE muted_users (
    id INTEGER PRIMARY KEY,
    room_id INTEGER,
    username VARCHAR,
    muted_by VARCHAR,
    created_at DATETIME
);
```

---

## Testing Instructions

### Test Admin Features:

1. **Create a room** and join with username "Alice"
   - You become the admin automatically
   - You'll see the Users icon (👥) in the header

2. **Join with another user** (username "Bob") in a different browser/tab
   - Bob can send messages normally

3. **As Admin (Alice):**
   - Click Users icon to see online users
   - Click 🔇 next to Bob to mute him
   - Bob will see a notification that he's muted

4. **As Bob (Muted User):**
   - Try to send a message
   - Should see error: "You are muted and cannot send messages"

5. **As Admin (Alice):**
   - Click 🔊 next to Bob to unmute him
   - Bob can now send messages again

6. **Test Message Deletion:**
   - As admin, hover over any message
   - Click the trash icon
   - Message disappears for all users

7. **Test Chat History:**
   - Send some messages in a room
   - Leave and rejoin
   - All previous messages should be visible

---

## Files Modified

### Backend:
- `app/models.py` - Added MutedUser model and updated Room model
- `app/chat.py` - Added admin system, mute/unmute handlers, history on join

### Frontend:
- `studyroom-frontend/src/components/ChatRoom.jsx` - Added admin UI, mute/unmute controls

---

## API Changes

### WebSocket Messages (New):

**Admin Actions:**
```javascript
// Mute user
socket.send(JSON.stringify({
  type: "mute_user",
  username: "admin_username",
  target_username: "user_to_mute"
}));

// Unmute user
socket.send(JSON.stringify({
  type: "unmute_user",
  username: "admin_username",
  target_username: "user_to_unmute"
}));

// Delete message
socket.send(JSON.stringify({
  type: "delete_message",
  username: "admin_username",
  message_id: 123
}));
```

**Server Responses:**
```javascript
// User muted notification
{
  type: "user_muted",
  target_username: "Bob",
  muted_by: "Alice"
}

// User unmuted notification
{
  type: "user_unmuted",
  target_username: "Bob",
  unmuted_by: "Alice"
}

// Error (muted user trying to send)
{
  type: "error",
  message: "You are muted and cannot send messages"
}

// Chat history on join
{
  type: "history",
  messages: [/* array of messages */]
}

// Admin status
{
  type: "admin_status",
  is_admin: true
}
```

---

## How to Run

### 1. Initialize Database:
```bash
python -m app.init_db
```

### 2. Start Backend:
```bash
python -m app.run_server
```

### 3. Start Frontend:
```bash
cd studyroom-frontend
npm run dev
```

---

## Notes

- Admin status is per-room, not global
- First user in each room becomes that room's admin
- Muted users can still read messages, just can't send
- Chat history is stored permanently in the database
- All admin actions are broadcast to all users in the room

---

## Troubleshooting

### "Admin features not showing"
- Make sure you're the first user in the room
- Check browser console for WebSocket messages
- Try leaving and rejoining the room

### "Can't mute users"
- Make sure you're the room admin (first user)
- Check that the user is actually online
- Check browser console for errors

### "Chat history not loading"
- Check database is initialized
- Check WebSocket is connected
- Check browser console for errors

