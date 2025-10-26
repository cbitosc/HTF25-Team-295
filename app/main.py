from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router  # Add "app."
from app.chat import router as chat_router  # Add "app."
import os
import shutil
import uuid
from pathlib import Path

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
# Use absolute path to avoid issues with working directory
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# Serve static files from uploads directory
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "Real-Time Study Room Chat API running!"}

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    room: str = Form(...),
    username: str = Form(...)
):
    """
    Upload a file and save it to the uploads directory.
    Returns the file URL that can be used to access the file.
    """
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate file URL
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        return {
            "file_url": file_url,
            "filename": file.filename,
            "message": "File uploaded successfully"
        }
    except Exception as e:
        return {"error": str(e), "message": "File upload failed"}