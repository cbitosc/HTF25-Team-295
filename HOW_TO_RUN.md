# How to Run the Study Chat Application

## Prerequisites
- Python 3.12+ installed
- Node.js and npm installed
- Virtual environment activated (if using venv)

## Running the Application

### Backend Server (Terminal 1)

Navigate to the app directory and run the server:

```bash
cd HTF25-Team-295
python -m app.run_server
```

Or if you're in the `app` directory:

```bash
python run_server.py
```

The server will start on `http://localhost:8000`

### Frontend (Terminal 2)

Navigate to the frontend directory and run the development server:

```bash
cd HTF25-Team-295/studyroom-frontend
npm install  # Only needed for first time
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

## File Upload Feature

✅ **File upload is now fully implemented!**

### How to Use File Upload:

1. Join a room in the chat application
2. Click the paperclip icon (📎) in the message input area
3. Select a file to upload
4. Click "Upload" button
5. The file will be uploaded and shared with all users in the room

### File Display Features:

- **Images**: Will be displayed inline as thumbnails that can be clicked to view full size
- **Other Files**: Will be displayed as download links with file size
- **File Metadata**: Shows filename and file size

### Technical Details:

- Files are saved in `app/uploads/` directory
- Each file gets a unique UUID filename to prevent conflicts
- Files are served at `http://localhost:8000/uploads/{filename}`
- File metadata (type, size, name) is transmitted through WebSocket

## API Endpoints

- `POST /upload` - Upload a file
- `GET /uploads/{filename}` - Download/view a file
- `WebSocket /chat/ws/{room_id}` - Real-time chat connection
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

## Troubleshooting

### Server Issues:
- Make sure port 8000 is not already in use
- Check that all Python dependencies are installed: `pip install -r requirements.txt`

### Frontend Issues:
- Make sure port 5173 (or the assigned port) is not in use
- Check that all npm packages are installed: `npm install`
- Verify the backend server is running on port 8000

### File Upload Issues:
- Check that `app/uploads/` directory exists and is writable
- Verify backend server is running and accessible
- Check browser console for any errors

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd HTF25-Team-295
python -m app.run_server

# Terminal 2 - Frontend  
cd HTF25-Team-295/studyroom-frontend
npm run dev
```

Then open your browser to `http://localhost:5173`

