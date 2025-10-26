# 🤖 AI-Powered Study Assistant Setup Guide

This guide explains how to set up and use the AI-powered Study Assistant feature in your FastAPI chat application.

## 🎯 Features

The AI Study Assistant provides:
- **Academic Help**: Explains complex topics in simple terms
- **Study Guidance**: Provides learning strategies and tips
- **Discussion Summaries**: Summarizes chat discussions
- **Conceptual Q&A**: Answers academic questions clearly
- **Real-time Integration**: Works seamlessly with existing chat system

## 🚀 Quick Start

### 1. Set Up Environment Variable

You need an OpenRouter API key to use the AI assistant:

```bash
# Set your OpenRouter API key
export OPENROUTER_API_KEY="your-openrouter-api-key-here"
```

**Getting an OpenRouter API Key:**
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. The free tier includes access to the `openai/gpt-oss-20b:free` model

### 2. Install Dependencies

The AI helper uses the `openai` package. Make sure it's installed:

```bash
# If not already installed
pip install openai
```

### 3. Start the Server

```bash
# Start the FastAPI backend
cd HTF25-Team-295/app
python main.py
```

### 4. Start the Frontend

```bash
# In a new terminal, start the React frontend
cd HTF25-Team-295/studyroom-frontend
npm run dev
```

## 💬 How to Use

### In the Chat Interface

1. **Join a room** with your username
2. **Type messages starting with `@bot`** to get AI assistance
3. **Examples:**
   - `@bot explain photosynthesis`
   - `@bot help with calculus derivatives`
   - `@bot summarize this discussion`
   - `@bot what is machine learning?`

### AI Message Styling

- AI responses appear with a **purple gradient background**
- AI messages show a **🤖 robot icon**
- Username displays as **"AI Assistant"**

## 🔧 Technical Details

### Backend API Endpoints

- **POST `/ai/helper`**: Main AI assistance endpoint
  - Request: `{"message": "your question"}`
  - Response: `{"reply": "AI response"}`

- **GET `/ai/health`**: Health check endpoint
  - Returns service status and configuration

### Frontend Integration

- **Detection**: Messages starting with `@bot` trigger AI calls
- **API Call**: Uses `fetch()` to call `/ai/helper` endpoint
- **UI Updates**: AI responses appear as special chat messages
- **Error Handling**: Graceful fallback for API failures

### Model Configuration

- **Model**: `openai/gpt-oss-20b:free` (free OpenRouter model)
- **Max Tokens**: 500 (optimized for chat)
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **System Prompt**: Academic-focused assistance

## 🧪 Testing

### Test the AI Helper

Run the test script to verify everything works:

```bash
cd HTF25-Team-295/app
python test_ai_helper.py
```

This will:
1. Check if the API key is configured
2. Test the health check endpoint
3. Send a sample question to the AI
4. Display the response

### Manual Testing

1. **Start both servers** (backend + frontend)
2. **Join a chat room**
3. **Type `@bot hello`** - should show usage hints
4. **Type `@bot explain gravity`** - should get AI response
5. **Check for proper styling** - purple gradient, robot icon

## 🛠️ Troubleshooting

### Common Issues

**"AI service not configured"**
- Make sure `OPENROUTER_API_KEY` environment variable is set
- Restart the server after setting the variable

**"Connection Error"**
- Ensure FastAPI server is running on `localhost:8000`
- Check if the `/ai/helper` endpoint is accessible

**"AI responses not appearing"**
- Check browser console for JavaScript errors
- Verify the frontend is calling the correct API endpoint
- Ensure CORS is properly configured

**"API key invalid"**
- Verify your OpenRouter API key is correct
- Check if you have sufficient credits/quota
- Try the health check endpoint first

### Debug Mode

Enable debug logging by checking the browser console and server logs:

```bash
# Backend logs will show AI requests
# Frontend console will show fetch calls and responses
```

## 📁 File Structure

```
HTF25-Team-295/
├── app/
│   ├── ai_helper.py          # AI helper module
│   ├── main.py               # Updated with AI router
│   └── test_ai_helper.py     # Test script
└── studyroom-frontend/
    └── src/
        └── components/
            └── ChatRoom.jsx  # Updated with @bot detection
```

## 🔒 Security Notes

- **API Key**: Keep your OpenRouter API key secure
- **Rate Limiting**: The free model has usage limits
- **Input Validation**: User messages are validated before sending to AI
- **Error Handling**: Sensitive errors are not exposed to users

## 🎨 Customization

### Modify AI Behavior

Edit the system prompt in `ai_helper.py`:

```python
system_prompt = """Your custom AI assistant instructions here..."""
```

### Change AI Styling

Modify the CSS classes in `ChatRoom.jsx`:

```javascript
// AI message styling
"bg-gradient-to-r from-purple-600 to-blue-600"
```

### Add More Models

Update the model name in `ai_helper.py`:

```python
model="your-preferred-model-name"
```

## 🚀 Production Deployment

For production deployment:

1. **Environment Variables**: Use proper secret management
2. **Rate Limiting**: Implement request rate limiting
3. **Monitoring**: Add logging and monitoring
4. **Error Handling**: Implement comprehensive error handling
5. **Caching**: Consider caching frequent AI responses

## 📞 Support

If you encounter issues:

1. Check the test script output
2. Verify environment variables
3. Check server logs
4. Test with simple questions first
5. Ensure all dependencies are installed

---

**Happy Studying with AI! 🤖📚**
