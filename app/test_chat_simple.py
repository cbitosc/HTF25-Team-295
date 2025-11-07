# Quick test to check if chat works
import requests
import json

# Test basic endpoint
try:
    response = requests.get("http://localhost:8000/")
    print("✅ Basic server response:", response.json())
except Exception as e:
    print(f"❌ Server error: {e}")

# Test history endpoint
try:
    response = requests.get("http://localhost:8000/chat/history/testroom")
    print("✅ History endpoint response:", response.json())
except Exception as e:
    print(f"❌ History endpoint error: {e}")

print("\nIf you see errors, the server might not be running or database is broken.")

