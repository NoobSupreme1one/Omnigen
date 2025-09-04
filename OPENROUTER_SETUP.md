# OpenRouter Integration Setup

Omnigen now uses OpenRouter for all text generation with automatic model rotation to handle rate limits and API failures.

## Configuration

### 1. OpenRouter API Key

You need an OpenRouter API key to use the text generation features. 

1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Update the `free_models.txt` file with your API key:

```
# Replace YOUR_OPENROUTER_API_KEY_HERE with your actual API key
api_key: YOUR_OPENROUTER_API_KEY_HERE
```

### 2. Model Configuration

The app automatically rotates through free models listed in `free_models.txt`. The current configuration includes:

- DeepSeek R1 models (latest reasoning models)
- Meta Llama 3.3 70B (high-quality general purpose)
- Google Gemini 2.0 Flash (fast responses)
- Various other free models for fallback

### 3. How Model Rotation Works

The OpenRouter service automatically:

1. **Tries the current model** for each request
2. **Detects failures** like rate limits (429), API errors (500, 502, 503), insufficient quota, etc.
3. **Rotates to next model** when failures occur
4. **Continues rotation** until a model succeeds or all models are exhausted
5. **Provides detailed logging** so you can see which models are working

### 4. Error Handling

The service handles these scenarios automatically:

- **Rate Limits**: Rotates to next model immediately
- **Model Overloaded**: Tries different model
- **Network Timeouts**: Retries with next model
- **API Errors**: Switches to backup models
- **Invalid Responses**: Moves to next available model

### 5. Usage in Code

All existing services now use OpenRouter automatically:

```typescript
// Article generation
const article = await generateArticleFromTemplate(template, apiKey);

// Book content generation  
const content = await generateContent(title, description, apiKey);

// Blog analysis
const analysis = await analyzeBlogContent(url, username, password, apiKey);

// Any other text generation...
```

### 6. Monitoring

Check the browser console for OpenRouter status messages:

- `✅ Content generated successfully with model: [model-name]`
- `🔄 Rotating to model: [model-name]` 
- `❌ Model [model-name] failed with status [code]`

### 7. Testing

Run the test script to validate your setup:

```bash
# Set your API key
export OPENROUTER_API_KEY="your-key-here"

# Run test
node test-openrouter.mjs
```

### 8. Customizing Models

You can modify `free_models.txt` to:

- Add new models from OpenRouter's catalog
- Remove models that don't work well for your use case
- Reorder models by preference (top models are tried first)
- Change the base URL if needed

### 9. Troubleshooting

**No content generated**: Check that your API key is valid and has credits

**All models failing**: Verify your OpenRouter account status and API limits

**Specific model errors**: Some free models have usage limits or may be temporarily unavailable

**Network errors**: Check your internet connection and firewall settings

### 10. Benefits

- **Reliability**: Never fails due to single model issues
- **Performance**: Automatically finds the fastest available model
- **Cost-effective**: Uses free models with intelligent fallbacks
- **Transparent**: Clear logging shows which models are working
- **Scalable**: Easily add new models to the rotation