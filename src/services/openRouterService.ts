// Browser-compatible version - will fetch models config via API or environment

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

interface ModelConfig {
  models: string[];
  baseUrl: string;
  apiKey: string;
}

class OpenRouterService {
  private modelConfig: ModelConfig | null = null;
  private currentModelIndex = 0;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.loadModelConfig().catch(console.error);
  }

  private async loadModelConfig(): Promise<void> {
    try {
      // Try to fetch from public folder or use default config
      const models = [
        'openrouter/horizon-beta',
        'deepseek/deepseek-r1-0528:free',
        'deepseek/deepseek-r1:free', 
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash-experimental:free',
        'deepseek/deepseek-v3-0324:free',
        'qwen/qwen3-coder:free',
        'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
        'deepseek/deepseek-r1-distill-qwen-14b:free',
        'tngtech/deepseek-r1t2-chimera:free',
        'tngtech/deepseek-r1t-chimera:free',
        'rekaai/reka-flash-3:free',
        'moonshotai/kimi-k2:free',
        'featherless/qrwkv-72b:free',
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'z-ai/glm-4.5-air:free',
        'google/gemma-3n-4b:free',
        'sarvamai/sarvam-m:free',
        'openrouter/cypher-alpha:free',
        'meta-llama/llama-3.2-3b-instruct:free'
      ];

      const baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
      const apiKey = ''; // Will be passed as parameter

      this.modelConfig = { models, baseUrl, apiKey };
      console.log(`✅ Loaded ${models.length} OpenRouter models`);
      console.log(`🔧 Base URL: ${baseUrl}`);
      console.log(`🤖 Available models: ${models.slice(0, 3).join(', ')}${models.length > 3 ? '...' : ''}`);
      
    } catch (error) {
      console.error('❌ Error loading model configuration:', error);
      // Fallback configuration
      this.modelConfig = {
        models: ['meta-llama/llama-3.3-70b-instruct:free'],
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: ''
      };
    }
  }

  private getCurrentModel(): string {
    if (!this.modelConfig || this.modelConfig.models.length === 0) {
      return 'meta-llama/llama-3.3-70b-instruct:free';
    }
    return this.modelConfig.models[this.currentModelIndex];
  }

  private rotateToNextModel(): void {
    if (!this.modelConfig || this.modelConfig.models.length === 0) return;
    
    this.currentModelIndex = (this.currentModelIndex + 1) % this.modelConfig.models.length;
    console.log(`🔄 Rotating to model: ${this.getCurrentModel()}`);
  }

  private shouldRetryWithNextModel(error: any, statusCode?: number): boolean {
    // Rate limit errors
    if (statusCode === 429) return true;
    
    // API errors that might indicate model issues
    if (statusCode === 400 || statusCode === 500 || statusCode === 502 || statusCode === 503) return true;
    
    // OpenRouter specific error types
    if (error?.type === 'rate_limit_exceeded') return true;
    if (error?.type === 'insufficient_quota') return true;
    if (error?.type === 'model_overloaded') return true;
    if (error?.code === 'rate_limit_exceeded') return true;
    
    // Generic timeout or connection errors
    if (error?.message?.includes('timeout')) return true;
    if (error?.message?.includes('network')) return true;
    if (error?.message?.includes('ECONNRESET')) return true;
    if (error?.message?.includes('ETIMEDOUT')) return true;
    
    return false;
  }

  async generateContent(
    prompt: string,
    maxTokens: number = 2048,
    temperature: number = 0.7,
    customApiKey?: string
  ): Promise<string> {
    if (!this.modelConfig) {
      throw new Error('OpenRouter service not initialized. Please check free_models.txt file.');
    }

    // Priority: customApiKey > environment variable > config file
    const envApiKey = import.meta.env?.VITE_OPENROUTER_API_KEY;
    const apiKey = customApiKey || envApiKey || this.modelConfig.apiKey;
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 OpenRouter API Key Debug:');
      console.log('  - Custom API Key:', customApiKey ? 'Provided' : 'Not provided');
      console.log('  - Environment API Key:', envApiKey ? 'Found' : 'Not found');
      console.log('  - Final API Key:', apiKey ? (apiKey.substring(0, 12) + '...') : 'None');
    }
    
    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
      console.error('❌ OpenRouter API key not found or is placeholder');
      console.error('💡 Make sure VITE_OPENROUTER_API_KEY is set in your .env file');
      console.error('💡 Available env vars:', Object.keys(import.meta.env || {}));
      throw new Error('OpenRouter API key is required. Please set VITE_OPENROUTER_API_KEY in your .env file or pass as parameter.');
    }

    let lastError: any = null;
    const maxModelTries = Math.min(this.modelConfig.models.length, 3); // Try up to 3 models

    for (let modelTry = 0; modelTry < maxModelTries; modelTry++) {
      const currentModel = this.getCurrentModel();
      
      try {
        console.log(`🤖 Attempting generation with model: ${currentModel} (attempt ${modelTry + 1}/${maxModelTries})`);

        const response = await fetch(this.modelConfig.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://omnigen.app',
            'X-Title': 'Omnigen'
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            stream: false
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Model ${currentModel} failed with status ${response.status}:`, errorText);
          
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          if (this.shouldRetryWithNextModel(errorData, response.status)) {
            lastError = new Error(`Model ${currentModel} failed: ${response.status} - ${errorData.message || errorText}`);
            this.rotateToNextModel();
            continue;
          } else {
            // Non-retryable error
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.message || errorText}`);
          }
        }

        const data: OpenRouterResponse = await response.json();
        
        if (data.error) {
          console.error(`❌ Model ${currentModel} returned error:`, data.error);
          
          if (this.shouldRetryWithNextModel(data.error)) {
            lastError = new Error(`Model ${currentModel} error: ${data.error.message}`);
            this.rotateToNextModel();
            continue;
          } else {
            throw new Error(`OpenRouter API error: ${data.error.message}`);
          }
        }

        if (!data.choices || data.choices.length === 0) {
          console.error(`❌ Model ${currentModel} returned no choices`);
          lastError = new Error(`Model ${currentModel} returned no choices`);
          this.rotateToNextModel();
          continue;
        }

        const generatedContent = data.choices[0]?.message?.content || '';
        
        if (!generatedContent.trim()) {
          console.error(`❌ Model ${currentModel} returned empty content`);
          lastError = new Error(`Model ${currentModel} returned empty content`);
          this.rotateToNextModel();
          continue;
        }

        console.log(`✅ Content generated successfully with model: ${currentModel}`);
        return generatedContent.trim();

      } catch (error) {
        console.error(`❌ Error with model ${currentModel}:`, error);
        
        if (this.shouldRetryWithNextModel(error)) {
          lastError = error;
          this.rotateToNextModel();
          continue;
        } else {
          throw error;
        }
      }
    }

    // If we've tried multiple models and all failed
    throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // Helper method to get model status
  getModelStatus(): { currentModel: string; totalModels: number; currentIndex: number } {
    return {
      currentModel: this.getCurrentModel(),
      totalModels: this.modelConfig?.models.length || 0,
      currentIndex: this.currentModelIndex
    };
  }

  // Method to manually set model index
  setModelIndex(index: number): void {
    if (!this.modelConfig || index < 0 || index >= this.modelConfig.models.length) {
      throw new Error('Invalid model index');
    }
    this.currentModelIndex = index;
    console.log(`🎯 Manually set model to: ${this.getCurrentModel()}`);
  }

  // Method to get all available models
  getAvailableModels(): string[] {
    return this.modelConfig?.models || [];
  }
}

// Create a singleton instance
const openRouterService = new OpenRouterService();

// Export the service methods
export const generateContent = (
  prompt: string,
  apiKey?: string,
  maxTokens: number = 2048,
  temperature: number = 0.7
): Promise<string> => {
  return openRouterService.generateContent(prompt, maxTokens, temperature, apiKey);
};

export const getModelStatus = () => openRouterService.getModelStatus();
export const setModelIndex = (index: number) => openRouterService.setModelIndex(index);
export const getAvailableModels = () => openRouterService.getAvailableModels();

// Re-export common functions for backward compatibility
export const researchTopic = async (topic: string, description: string, apiKey: string): Promise<string> => {
  const prompt = `Research and provide comprehensive information about: ${topic}

Context: ${description}

Please provide:
1. Key facts and current information
2. Recent developments or trends
3. Expert opinions or statistics
4. Practical applications or examples
5. Any important considerations or nuances

Focus on providing accurate, up-to-date information that would be valuable for creating educational content on this topic.`;

  return await generateContent(prompt, apiKey, 1000, 0.2);
};

export const generateBookDescription = async (
  genre: string,
  subGenre?: string,
  tone?: string,
  perspective?: string,
  heatLevel?: string,
  targetAudience?: string,
  apiKey?: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  let prompt = `Generate a compelling book description for a ${genre} book`;

  if (subGenre && genre.toLowerCase() === 'romance') {
    prompt += ` in the ${subGenre} sub-genre`;
  }

  if (tone) {
    prompt += ` with a ${tone.toLowerCase()} tone`;
  }

  if (perspective) {
    const perspectiveLabels = {
      'first': 'first person',
      'third-limited': 'third person limited',
      'third-omniscient': 'third person omniscient',
      'second': 'second person'
    };
    if (perspective in perspectiveLabels) {
      prompt += ` written in ${perspectiveLabels[perspective as keyof typeof perspectiveLabels]}`;
    }
  }

  if (heatLevel && genre.toLowerCase() === 'romance') {
    const heatLevelLabels = {
      'clean': 'clean/wholesome',
      'sweet': 'sweet',
      'sensual': 'sensual',
      'steamy': 'steamy',
      'spicy': 'spicy',
      'explicit': 'explicit'
    };
    if (heatLevel in heatLevelLabels) {
      prompt += ` with ${heatLevelLabels[heatLevel as keyof typeof heatLevelLabels]} heat level`;
    }
  }

  if (targetAudience) {
    prompt += ` for ${targetAudience}`;
  }

  prompt += `. The description should be 2-3 sentences that outline what the book will cover, its main themes, and what readers can expect to learn or experience. Make it engaging and specific to the genre and settings provided. Focus on creating an enticing hook that would make readers want to purchase and read the book.`;

  return await generateContent(prompt, apiKey, 500, 0.7);
};

export default openRouterService;