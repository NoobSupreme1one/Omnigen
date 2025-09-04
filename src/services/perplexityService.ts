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
    throw new Error('Perplexity API key is required');
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

  try {
    console.log('🤖 Generating book description with Perplexity...');

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
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error Response:', errorText);

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Perplexity API key.');
      } else if (response.status === 403) {
        throw new Error('API access forbidden. Please check your Perplexity API permissions.');
      } else {
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }
    }

    const data: PerplexityResponse = await response.json();
    const generatedDescription = data.choices[0]?.message?.content || '';

    if (!generatedDescription.trim()) {
      throw new Error('No description generated from Perplexity API');
    }

    console.log('✅ Book description generated successfully with Perplexity');
    return generatedDescription.trim();

  } catch (error) {
    console.error('❌ Error generating book description with Perplexity:', error);
    throw error;
  }
};

// General content generation function
export const generateContent = async (
  prompt: string,
  apiKey: string,
  maxTokens: number = 2048,
  temperature: number = 0.7
): Promise<string> => {
  if (!apiKey) {
    throw new Error('Perplexity API key is required');
  }

  try {
    console.log('🤖 Generating content with Perplexity...');

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
        max_tokens: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error Response:', errorText);

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Perplexity API key.');
      } else if (response.status === 403) {
        throw new Error('API access forbidden. Please check your Perplexity API permissions.');
      } else {
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }
    }

    const data: PerplexityResponse = await response.json();
    const generatedContent = data.choices[0]?.message?.content || '';

    if (!generatedContent.trim()) {
      throw new Error('No content generated from Perplexity API');
    }

    console.log('✅ Content generated successfully with Perplexity');
    return generatedContent.trim();

  } catch (error) {
    console.error('❌ Error generating content with Perplexity:', error);
    throw error;
  }
};

// Generate book outline
export const generateBookOutline = async (
  prompt: string,
  genre: string,
  subGenre: string,
  targetAudience: string,
  heatLevel: string,
  perspective: string,
  author: string,
  apiKey: string
): Promise<any> => {
  const fullPrompt = `Generate a comprehensive book outline based on the following details:

Book Description: ${prompt}
Genre: ${genre}
${subGenre ? `Sub-genre: ${subGenre}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${heatLevel ? `Heat Level: ${heatLevel}` : ''}
${perspective ? `Narrative Perspective: ${perspective}` : ''}
${author ? `Author: ${author}` : ''}

Please generate a comprehensive book outline with the following structure in JSON format:

{
  "title": "Book Title",
  "summary": "Brief book summary (2-3 sentences)",
  "characters": [
    {
      "name": "Character Name",
      "description": "Character description and role"
    }
  ],
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "description": "Chapter summary and key events",
      "subChapters": [
        {
          "title": "Section Title",
          "description": "Section description"
        }
      ]
    }
  ]
}

Make sure the content is engaging, well-structured, and appropriate for the specified genre and audience. Include at least 10 chapters with 3-5 sections each.`;

  return await generateContent(fullPrompt, apiKey, 4096, 0.8);
};

// Generate chapter outline
export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<any[]> => {
  const prompt = `Generate a detailed outline for a book chapter with the following details:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

Please create 3-5 sections for this chapter. Return the response as a JSON array in this format:

[
  {
    "title": "Section Title",
    "description": "Detailed description of what this section covers"
  }
]

Make sure each section flows logically and contributes to the overall chapter narrative.`;

  const response = await generateContent(prompt, apiKey, 1024, 0.7);

  try {
    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: create basic sections
    return [
      {
        title: `${chapterTitle} - Part 1`,
        description: chapterDescription
      }
    ];
  } catch (error) {
    console.warn('Failed to parse chapter outline JSON, using fallback');
    return [
      {
        title: `${chapterTitle} - Part 1`,
        description: chapterDescription
      }
    ];
  }
};

// Generate blog article
export const generateBlogArticle = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Write a comprehensive, high-quality blog article for the following chapter:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

Requirements:
- Structure the content with a clear introduction, body, and conclusion
- Use headings and subheadings to organize the content
- Write in an engaging and informative tone
- The article should be at least 800 words
- Do not include markdown formatting
- Make it SEO-friendly and engaging for readers

Please write the complete article now:`;

  return await generateContent(prompt, apiKey, 3072, 0.7);
};

// Generate content with heat level (for romance books)
export const generateContentWithHeatLevel = async (
  sectionTitle: string,
  sectionDescription: string,
  heatLevel: string,
  perspective: string,
  apiKey: string
): Promise<string> => {
  let heatLevelPrompt = '';
  switch (heatLevel?.toLowerCase()) {
    case 'clean':
      heatLevelPrompt = 'Keep content completely clean and wholesome. No sexual content, innuendo, or romantic physical contact beyond hand-holding and brief kisses.';
      break;
    case 'sweet':
      heatLevelPrompt = 'Include sweet romantic moments with light physical affection like hugging, kissing, and cuddling. No explicit sexual content.';
      break;
    case 'sensual':
      heatLevelPrompt = 'Include sensual romantic scenes with passionate kissing and intimate moments, but fade to black before explicit content.';
      break;
    case 'steamy':
      heatLevelPrompt = 'Include steamy romantic scenes with detailed physical intimacy and sexual tension, but keep explicit details tasteful.';
      break;
    case 'spicy':
      heatLevelPrompt = 'Include spicy romantic scenes with explicit sexual content and detailed intimate moments.';
      break;
    case 'explicit':
      heatLevelPrompt = 'Include explicit romantic scenes with detailed sexual content and graphic intimate moments.';
      break;
    default:
      heatLevelPrompt = 'Include appropriate romantic content for the story.';
  }

  let perspectivePrompt = '';
  switch (perspective?.toLowerCase()) {
    case 'first':
      perspectivePrompt = 'Write in first person perspective (I, me, my).';
      break;
    case 'third-limited':
      perspectivePrompt = 'Write in third person limited perspective (he, she, they - from one character\'s viewpoint).';
      break;
    case 'third-omniscient':
      perspectivePrompt = 'Write in third person omniscient perspective (he, she, they - with access to multiple characters\' thoughts).';
      break;
    case 'second':
      perspectivePrompt = 'Write in second person perspective (you, your).';
      break;
    default:
      perspectivePrompt = 'Use an appropriate narrative perspective for the story.';
  }

  const prompt = `Write comprehensive, high-quality content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Heat Level Guidelines: ${heatLevelPrompt}
${perspectivePrompt}

Requirements:
- Structure the content with clear paragraphs
- Make it suitable for an eBook format
- Adhere to the specified heat level throughout
- Do not include markdown formatting or section headers
- Create engaging, well-written prose

Please write the content now:`;

  return await generateContent(prompt, apiKey, 2048, 0.7);
};

// Analyze content and generate topics
export const analyzeContentAndGenerateTopics = async (
  content: string,
  apiKey: string
): Promise<any> => {
  const prompt = `Please analyze the following content from a WordPress blog. Based on the analysis, generate a list of 5 new, relevant, and SEO-friendly blog post topics.

Content:
${content}

Please provide a response in the following JSON format:
{
  "analysis": {
    "writingStyle": "...",
    "tone": "...",
    "commonTopics": "...",
    "seoPatterns": "..."
  },
  "suggestedTopics": [
    {
      "title": "...",
      "description": "..."
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

  const response = await generateContent(prompt, apiKey, 2048, 0.7);

  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error parsing analysis response:', error);
    // Return fallback structure
    return {
      analysis: {
        writingStyle: "Informative",
        tone: "Professional",
        commonTopics: "General topics",
        seoPatterns: "Standard SEO practices"
      },
      suggestedTopics: [
        {
          title: "New Blog Post Ideas",
          description: "Fresh content ideas for your blog"
        }
      ]
    };
  }
};

// Generate article from topic and analysis
export const generateArticleFromAnalysis = async (
  topicTitle: string,
  topicDescription: string,
  analysis: any,
  apiKey: string
): Promise<string> => {
  const prompt = `Please write a complete, SEO-optimized blog article based on the following topic and content analysis.

Topic: ${topicTitle}
Description: ${topicDescription}

Content Analysis:
- Writing Style: ${analysis.writingStyle}
- Tone: ${analysis.tone}
- Common Topics: ${analysis.commonTopics}
- SEO Patterns: ${analysis.seoPatterns}

Requirements:
- The article should be at least 800 words
- Use HTML formatting (e.g., <h2>, <p>, <ul>, <li>, <strong>)
- The article should be engaging, informative, and well-structured
- The article should be SEO-optimized for the given topic
- Match the writing style and tone from the analysis

Please write the article now:`;

  return await generateContent(prompt, apiKey, 3072, 0.7);
};

// Blog analysis function
export const analyzeBlogContentWithAI = async (
  analysisPrompt: string,
  apiKey: string
): Promise<string> => {
  try {
    console.log('🤖 Calling Perplexity API for blog analysis...');
    const response = await generateContent(analysisPrompt, apiKey, 2048, 0.7);
    console.log('✅ Perplexity API response received');
    return response;
  } catch (error) {
    console.error('Error in blog analysis AI call:', error);
    throw new Error(`Blog analysis AI call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Edit content function
export const editContent = async (
  originalContent: string,
  selectedText: string,
  editPrompt: string,
  apiKey: string
): Promise<string> => {
  const prompt = `You are an expert editor helping to improve book content. You will be given:
1. The original content of a section
2. A specific portion of text that was selected
3. Instructions on how to edit that selected text

Please modify ONLY the selected text according to the instructions, while preserving the context and flow of the surrounding content.

ORIGINAL CONTENT:
${originalContent}

SELECTED TEXT TO EDIT:
"${selectedText}"

EDIT INSTRUCTIONS:
${editPrompt}

IMPORTANT: Return the COMPLETE modified content with the selected text edited according to the instructions. Do not add any explanations or commentary, just return the updated content.`;

  return await generateContent(prompt, apiKey, 2048, 0.7);
};

// Generate content with persona
export const generateContentWithPersona = async (
  prompt: string,
  persona: any,
  apiKey: string
): Promise<string> => {
  const personaPrompt = `You are writing in the style of ${persona.name}.

Persona Description: ${persona.description}
${persona.author_name ? `Author Name: ${persona.author_name}` : ''}

${persona.preferences ? `
Writing Preferences:
- Preferred Genres: ${persona.preferences.preferredGenres?.join(', ') || 'Any'}
- Target Audience: ${persona.preferences.targetAudience?.join(', ') || 'General'}
- Avoided Topics: ${persona.preferences.avoidedTopics?.join(', ') || 'None'}
- Special Instructions: ${persona.preferences.specialInstructions || 'None'}
` : ''}

${persona.sample_text ? `
Sample of this persona's writing style:
"${persona.sample_text}"

Please match this writing style, tone, and voice.
` : ''}

Now, please write content for the following prompt while maintaining this persona's unique voice and style:

${prompt}`;

  return await generateContent(personaPrompt, apiKey, 2048, 0.8);
};

// Duplicate function removed - using the one at line 238 instead

// Generate chapter outline - migrated from geminiService
export const generateChapterOutlineFromDescription = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<any[]> => {
  const prompt = `Generate a detailed outline for a book chapter with the following details:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

Please create 3-5 sections for this chapter. Return the response as a JSON array in this format:

[
  {
    "title": "Section Title",
    "description": "Detailed description of what this section covers"
  }
]

Make sure each section flows logically and contributes to the overall chapter narrative.

IMPORTANT: Return ONLY the JSON array, no additional text or formatting.`;

  const response = await generateContent(prompt, apiKey, 1024, 0.7);

  try {
    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: create basic sections
    return [
      {
        title: `${chapterTitle} - Part 1`,
        description: chapterDescription
      }
    ];
  } catch (error) {
    console.warn('Failed to parse chapter outline JSON, using fallback');
    return [
      {
        title: `${chapterTitle} - Part 1`,
        description: chapterDescription
      }
    ];
  }
};