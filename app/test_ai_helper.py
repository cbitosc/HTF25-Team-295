#!/usr/bin/env python3
"""
Test script for AI Helper functionality

This script tests the AI helper endpoint to ensure it's working correctly.
Run this after setting up the OPENROUTER_API_KEY environment variable.
"""

import requests
import json
import os

def test_ai_helper():
    """Test the AI helper endpoint"""
    
    # Check if API key is configured
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ OPENROUTER_API_KEY environment variable not set!")
        print("Please set it with: export OPENROUTER_API_KEY='your-api-key'")
        return False
    
    # Test data
    test_message = "Explain photosynthesis in simple terms"
    
    # API endpoint
    url = "http://localhost:8000/ai/helper"
    
    # Request payload
    payload = {
        "message": test_message
    }
    
    try:
        print(f"🧪 Testing AI Helper with message: '{test_message}'")
        print("📡 Sending request to:", url)
        
        # Send POST request
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ AI Helper Response:")
            print(f"🤖 {data.get('reply', 'No reply received')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the FastAPI server is running on localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: The AI service took too long to respond")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_health_check():
    """Test the health check endpoint"""
    
    try:
        print("\n🏥 Testing health check endpoint...")
        response = requests.get("http://localhost:8000/ai/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health Check Response:")
            print(f"   Status: {data.get('status')}")
            print(f"   API Key Configured: {data.get('api_key_configured')}")
            print(f"   Model: {data.get('model')}")
            print(f"   Service: {data.get('service')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AI Helper Test Suite")
    print("=" * 50)
    
    # Test health check first
    health_ok = test_health_check()
    
    if health_ok:
        # Test AI helper functionality
        ai_ok = test_ai_helper()
        
        if ai_ok:
            print("\n🎉 All tests passed! AI Helper is working correctly.")
        else:
            print("\n❌ AI Helper test failed.")
    else:
        print("\n❌ Health check failed. Please check your setup.")
    
    print("\n" + "=" * 50)
    print("💡 To use in the chat app, type messages starting with '@bot'")
    print("   Example: '@bot explain quantum physics'")
