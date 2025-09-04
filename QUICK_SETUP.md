# 🚀 Quick OpenRouter Setup

Your Omnigen app is ready but needs an API key to generate content.

## ✅ Environment Variable Setup (Recommended)

1. **Get your OpenRouter API key**:
   - Go to [https://openrouter.ai/](https://openrouter.ai/)
   - Sign up and get your API key (starts with `sk-or-`)

2. **Add to your .env.local file**:
   ```bash
   # Add this line to .env.local:
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

   Or if you prefer .env:
   ```bash
   # Add this line to .env:
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

## Alternative: Direct Configuration

**Update free_models.txt** (less secure):
```bash
# Replace line 27 in free_models.txt:
api_key: YOUR_OPENROUTER_API_KEY_HERE

# With your actual key:
api_key: sk-or-v1-your-actual-key-here
```

## ✅ Test It Works

After adding your API key:

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Try generating content**:
   - Go to book creation
   - Enter any prompt like "A mystery novel about a detective"
   - Click generate outline
   - You should see content generated successfully!

## 🔧 Troubleshooting

**Still getting API key errors?**
- Make sure there are no quotes around the key in free_models.txt
- Verify the key starts with `sk-or-`
- Restart your development server after changes

**Want to see model rotation in action?**
- Open browser developer tools (F12)
- Go to Console tab  
- Generate content and watch for messages like:
  - `✅ Content generated successfully with model: deepseek/deepseek-r1:free`
  - `🔄 Rotating to model: meta-llama/llama-3.3-70b-instruct:free`

## 💡 Free Usage

OpenRouter provides free tier access to many models. The app will automatically rotate through 20+ free models to ensure you always get responses even if some models are temporarily unavailable.

---

**Need help?** Check the full setup guide in `OPENROUTER_SETUP.md`