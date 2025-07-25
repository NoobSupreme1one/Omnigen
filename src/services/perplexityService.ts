const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

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

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error Response:', errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();
    console.log('Perplexity API Response:', data);
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No choices returned from Perplexity API');
    }
    
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
};