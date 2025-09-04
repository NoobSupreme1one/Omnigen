import { GoogleGenAI } from '@google/genai';

// Initialize Vertex AI with your Cloud project and location
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'unstackapp',
  location: 'global'
});

const model = 'gemini-2.5-flash-lite';

// Set up generation config with safety settings disabled
const generationConfig = {
  maxOutputTokens: 65535,
  temperature: 0.7,
  topP: 0.95,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
};

/**
 * Generate content using Vertex AI with fallback to regular Gemini API
 */
async function generateContentWithVertexAi(prompt: string, customConfig?: any, apiKey?: string): Promise<string> {
  // First try Vertex AI
  try {
    console.log('🤖 Attempting Vertex AI (Gemini 2.5 Flash Lite)...');

    const config = customConfig || generationConfig;

    const req = {
      model: model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: config,
    };

    const streamingResp = await ai.models.generateContentStream(req);

    let fullResponse = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }

    if (!fullResponse.trim()) {
      throw new Error('No content generated - response was empty');
    }

    console.log('✅ Content generated successfully with Vertex AI');
    return fullResponse.trim();

  } catch (vertexError) {
    console.warn('⚠️ Vertex AI failed, falling back to regular Gemini API:', vertexError);

    // Fallback to regular Gemini API if we have an API key
    if (apiKey) {
      try {
        console.log('🔄 Falling back to Gemini 1.5 Pro API...');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: customConfig?.temperature || 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: customConfig?.maxOutputTokens || 2048,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
          } else if (response.status === 403) {
            throw new Error('API key invalid or quota exceeded. Please check your API key.');
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        }

        const data = await response.json();
        const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';

        if (!generatedText) {
          throw new Error('No content generated from fallback API.');
        }

        console.log('✅ Content generated successfully with fallback Gemini API');
        return generatedText.trim();

      } catch (fallbackError) {
        console.error('❌ Fallback API also failed:', fallbackError);
        throw new Error(`Both Vertex AI and fallback API failed. Vertex: ${vertexError instanceof Error ? vertexError.message : 'Unknown error'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    } else {
      throw new Error(`Vertex AI failed and no API key provided for fallback: ${vertexError instanceof Error ? vertexError.message : 'Unknown error'}`);
    }
  }
}

/**
 * Generate book description using Vertex AI with fallback
 */
export async function generateBookDescriptionWithVertexAi(
  genre: string,
  subGenre?: string,
  tone?: string,
  perspective?: string,
  heatLevel?: string,
  targetAudience?: string,
  apiKey?: string
): Promise<string> {
  try {
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
    
    prompt += `. The description should be 2-3 sentences that outline what the book will cover, its main themes, and what readers can expect to learn or experience. Make it engaging and specific to the genre and settings provided.`;

    // Use a slightly lower temperature for book descriptions to be more focused
    const descriptionConfig = {
      ...generationConfig,
      temperature: 0.7,
      maxOutputTokens: 2048
    };

    return await generateContentWithVertexAi(prompt, descriptionConfig, apiKey);

  } catch (error) {
    console.error('❌ Error generating book description with Vertex AI:', error);
    throw error;
  }
}

/**
 * Test Vertex AI connection
 */
export async function testVertexAiConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Vertex AI connection...');
    
    const testConfig = {
      ...generationConfig,
      maxOutputTokens: 100,
      temperature: 0.5
    };
    
    const response = await generateContentWithVertexAi('Hello! Please respond with "Vertex AI is working correctly."', testConfig);
    
    if (response && response.length > 0) {
      console.log('✅ Vertex AI connection test successful:', response);
      return true;
    } else {
      console.error('❌ Vertex AI connection test failed: Empty response');
      return false;
    }

  } catch (error) {
    console.error('❌ Vertex AI connection test error:', error);
    return false;
  }
}

export { generateContentWithVertexAi };
