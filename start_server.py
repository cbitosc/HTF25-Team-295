#!/usr/bin/env python3
"""
Simple server startup script for the Study Chat Application
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    import uvicorn
    
    print("🚀 Starting Study Chat Server with AI Assistant...")
    print("📍 Server will be available at: http://localhost:8000")
    print("🤖 AI Assistant endpoint: http://localhost:8000/ai/helper")
    print("📊 Health check: http://localhost:8000/ai/health")
    print("=" * 60)
    
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Please make sure all dependencies are installed:")
    print("pip install fastapi uvicorn openai passlib python-jose bcrypt sqlalchemy")
except Exception as e:
    print(f"❌ Error starting server: {e}")
