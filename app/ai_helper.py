# app/ai_helper.py
"""
AI-Powered Study Assistant Module

This module provides an AI-powered study assistant feature that can help students with:
- Explaining academic topics
- Summarizing discussion points
- Answering conceptual questions
- Providing study guidance

The AI assistant is triggered when users send messages starting with '@bot' in the chat.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from typing import Optional

# Create router for AI helper endpoints
router = APIRouter(prefix="/ai", tags=["AI Helper"])

# OpenAI client will be initialized when needed
client = None

def get_openai_client():
    """Initialize and return OpenAI client if API key is available"""
    global client
    if client is None and os.getenv("OPENROUTER_API_KEY"):
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
    return client

# Pydantic model for request validation
class AIHelperRequest(BaseModel):
    """Request model for AI helper endpoint"""
    message: str

# Pydantic model for response
class AIHelperResponse(BaseModel):
    """Response model for AI helper endpoint"""
    reply: str

@router.post("/helper", response_model=AIHelperResponse)
async def ai_helper(request: AIHelperRequest):
    """
    AI-Powered Study Assistant Endpoint
    
    This endpoint processes study-related questions and provides AI-powered assistance.
    It's designed to help students with academic topics, explanations, and study guidance.
    
    Args:
        request (AIHelperRequest): Contains the user's message/question
        
    Returns:
        AIHelperResponse: Contains the AI's response
        
    Raises:
        HTTPException: If the API key is missing or the AI service fails
    """
    
    # Validate that the API key is configured
    if not os.getenv("OPENROUTER_API_KEY"):
        raise HTTPException(
            status_code=500, 
            detail="AI service not configured. Please set OPENROUTER_API_KEY environment variable."
        )
    
    try:
        # Get the OpenAI client
        openai_client = get_openai_client()
        if not openai_client:
            raise HTTPException(
                status_code=500, 
                detail="AI service not configured. Please set OPENROUTER_API_KEY environment variable."
            )
        
        # Create a study-focused system prompt to ensure the AI provides academic help
        system_prompt = """You are an AI Study Assistant designed to help students with academic topics. 
        Your role is to:
        - Explain complex concepts in simple, understandable terms
        - Provide study guidance and learning strategies
        - Answer academic questions clearly and concisely
        - Summarize discussion points when requested
        - Offer helpful study tips and techniques
        
        Keep your responses focused on educational content and be encouraging to students.
        If a question is not academic-related, politely redirect to study topics."""
        
        # Send the message to the AI model
        response = openai_client.chat.completions.create(
            model="openai/gpt-oss-20b:free",  # Free OpenRouter model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            max_tokens=500,  # Limit response length for chat compatibility
            temperature=0.7,  # Balanced creativity and accuracy
        )
        
        # Extract the AI's response
        ai_reply = response.choices[0].message.content
        
        # Return the response in the expected format
        return AIHelperResponse(reply=ai_reply)
        
    except Exception as e:
        # Log the error for debugging (in production, use proper logging)
        print(f"AI Helper Error: {str(e)}")
        
        # Return a user-friendly error message
        raise HTTPException(
            status_code=500,
            detail="Sorry, I'm having trouble processing your request right now. Please try again later."
        )

@router.get("/health")
async def ai_health_check():
    """
    Health check endpoint for the AI service
    
    Returns:
        dict: Status of the AI service configuration
    """
    api_key_configured = bool(os.getenv("OPENROUTER_API_KEY"))
    
    return {
        "status": "healthy" if api_key_configured else "misconfigured",
        "api_key_configured": api_key_configured,
        "model": "openai/gpt-oss-20b:free",
        "service": "OpenRouter AI"
    }
