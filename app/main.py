from fastapi import FastAPI
from app.auth import router as auth_router  # Add "app."
from app.chat import router as chat_router  # Add "app."

app = FastAPI()

app.include_router(auth_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "Real-Time Study Room Chat API running!"}