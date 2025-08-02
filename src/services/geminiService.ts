import { Book, BookChapter, SubChapter } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { generateOnlineCourse } from './onlineCourseService';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  const maxRetries = 5;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error Response:', errorText);
        
        // Check if it's a quota exhaustion error
        if (response.status === 429) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.status === "RESOURCE_EXHAUSTED") {
              throw new Error('Daily quota exceeded for Gemini API. Please wait 24 hours for quota reset or upgrade your Google Cloud billing plan. Visit https://ai.google.dev/gemini-api/docs/rate-limits for more information.');
            }
          } catch (parseError) {
            // If we can't parse the error, fall through to retry logic
            if (parseError instanceof Error && parseError.message.includes('Daily quota exceeded')) {
              throw parseError;
            }
          }
        
          // For other 429 errors, don't retry if we've already tried multiple times
          if (attempt >= 2) {
            throw new Error('API rate limit exceeded. Please try again later or check your API quota.');
          }
        }
        
        // If it's a rate limit error (429), retry with exponential backoff
        if (response.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`Rate limit hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('Gemini API Response:', data);
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }
      
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      // If this was our last attempt, re-throw the error
      if (attempt >= maxRetries) {
        console.error('Error calling Gemini API after all retries:', error);
        throw error;
      }
      
      // For network errors and other non-HTTP errors, also retry
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Network error. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Maximum retries exceeded');
};

/**
 * Generates an online course outline and converts it to Book format
 */
const generateOnlineCourseOutline = async (
  prompt: string,
  targetAudience: string,
  apiKey: string,
  author: string,
  generateAudio: boolean = false
): Promise<Book> => {
  try {
    // Generate the online course using the specialized service
    const course = await generateOnlineCourse(
      prompt, // topic
      `Online course about ${prompt} for ${targetAudience || 'students'}`, // description
      apiKey, // perplexityApiKey (using gemini key for now)
      apiKey, // geminiApiKey
      generateAudio // generateAudio (can be made configurable later)
    );

    // Convert course sections to book chapters
    const chapters: BookChapter[] = course.sections.map((section, index) => ({
      id: uuidv4(),
      title: section.title,
      description: section.summary,
      status: 'pending' as const,
      orderIndex: index,
      subChapters: [
        {
          id: uuidv4(),
          title: 'Lesson Plan',
          description: 'Detailed lesson plan for this section',
          content: section.lessonPlan,
          status: 'completed' as const,
          orderIndex: 0
        },
        {
          id: uuidv4(),
          title: 'Google Slides',
          description: 'Slide content for this section',
          content: section.slides.join('\n\n---\n\n'),
          status: 'completed' as const,
          orderIndex: 1
        },
        {
          id: uuidv4(),
          title: 'Narration Script',
          description: 'Audio script for this section',
          content: section.script,
          status: 'completed' as const,
          orderIndex: 2
        }
      ]
    }));

    return {
      id: uuidv4(),
      title: course.title,
      author: author || 'Course Instructor',
      description: course.description,
      genre: 'Online Course',
      subGenre: '',
      tone: 'Educational',
      heatLevel: '',
      perspective: '',
      targetAudience: targetAudience || 'Students',
      coverUrl: '',
      chapters,
      status: 'completed' as const
    };
  } catch (error) {
    console.error('Error generating online course outline:', error);
    throw new Error('Failed to generate online course outline. Please try again.');
  }
};

export const generateBookOutline = async (
  prompt: string, 
  genre: string, 
  subGenre: string,
  targetAudience: string, 
  heatLevel: string,
  perspective: string,
  author: string,
  apiKey: string,
  generateAudio: boolean = false
): Promise<Book> => {
  // Special handling for Online Course genre
  if (genre.toLowerCase() === 'online course') {
    return await generateOnlineCourseOutline(prompt, targetAudience, apiKey, author, generateAudio);
  }

  let heatLevelPrompt = '';
  if (genre.toLowerCase() === 'romance' && heatLevel) {
    const heatLevelDescriptions = {
      'clean': 'Clean/Wholesome romance with no explicit sexual content, focusing on emotional connection, meaningful glances, hugs, and light kissing.',
      'sweet': 'Sweet romance with closed-door intimate scenes that are implied rather than explicit, focusing on emotional development.',
      'sensual': 'Sensual romance with on-page love scenes using euphemistic language, emphasizing emotional aspects over explicit details.',
      'steamy': 'Steamy romance with explicit sexual content and detailed intimate scenes throughout the story.',
      'spicy': 'Spicy/Erotic romance with heavy emphasis on sexual activity, detailed descriptions, and multiple intimate scenes.',
      'explicit': 'Explicit romance with highly detailed and graphic sexual content, exploring characters\' desires in depth.'
    };
    
    heatLevelPrompt = `\nHeat Level: ${heatLevelDescriptions[heatLevel as keyof typeof heatLevelDescriptions] || heatLevel}`;
  }

  let subGenrePrompt = '';
  if (genre.toLowerCase() === 'romance' && subGenre) {
    subGenrePrompt = `\nSub-Genre: ${subGenre} romance`;
  }

  let perspectivePrompt = '';
  if (perspective) {
    const perspectiveDescriptions = {
      'first': 'Write in first person narrative (using "I" perspective), providing intimate access to the main character\'s thoughts and feelings.',
      'third-limited': 'Write in third person limited narrative (using "he/she" perspective), following one main character\'s viewpoint.',
      'third-omniscient': 'Write in third person omniscient narrative (using "he/she" perspective), with access to multiple characters\' thoughts and perspectives.',
      'second': 'Write in second person narrative (using "you" perspective), addressing the reader directly.'
    };
    
    perspectivePrompt = `\nNarrative Perspective: ${perspectiveDescriptions[perspective as keyof typeof perspectiveDescriptions] || perspective}`;
  }

  const coursePrompt = `\nCreate a comprehensive online course outline based on the following description:\n\nCourse Description: ${prompt}\nGenre: ${genre}\nTarget Audience: ${targetAudience}\n\nPlease provide a response in the following JSON format:\n{\n  "title": "Course Title",\n  "description": "Brief course description",\n  "genre": "${genre || 'General'}",\n  "subGenre": "${subGenre || ''}",\n  "targetAudience": "${targetAudience || 'General readers'}",\n  "heatLevel": "${heatLevel || ''}",\n  "perspective": "${perspective || ''}",\n  "chapters": [\n    {\n      "title": "Module Title",\n      "description": "Module description (2-3 sentences)"\n    }\n  ]\n}\n\nGenerate 5-7 modules that comprehensively cover the topic. Each module should have a clear, descriptive title and a detailed description of what it will cover.\n\nIMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n`;

  const bookPrompt = `\nCreate a comprehensive book outline based on the following description:\n\nBook Description: ${prompt}\n${genre ? `Genre: ${genre}` : ''}\n${subGenre ? `Sub-Genre: ${subGenre}` : ''}\n${targetAudience ? `Target Audience: ${targetAudience}` : ''}\n\nPlease provide a response in the following JSON format:\n{\n  "title": "Book Title",\n  "description": "Brief book description",\n  "genre": "${genre || 'General'}",\n   "subGenre": "${subGenre || ''}",\n  "targetAudience": "${targetAudience || 'General readers'}",\n  "heatLevel": "${heatLevel || ''}",\n  "perspective": "${perspective || ''}",\n  "chapters": [\n    {\n      "title": "Chapter Title",\n      "description": "Chapter description (2-3 sentences)"\n    }\n  ]\n}\n\nGenerate 8-12 chapters that comprehensively cover the topic. Make sure each chapter has a clear, descriptive title and a detailed description of what it will cover.${subGenrePrompt}${heatLevelPrompt ? ' Ensure the content and pacing align with the specified heat level.' : ''}\n${perspectivePrompt ? ' Maintain consistent narrative perspective throughout all content.' : ''}\n\nIMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n`;

  const fullPrompt = genre === 'Online Course Generator' ? coursePrompt : bookPrompt;

  const response = await callGeminiAPI(fullPrompt, apiKey);
  
  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    
    // Remove code block markers if present
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    // Find JSON object
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }
    
    const bookData = JSON.parse(jsonMatch[0]);
    
    return {
      id: uuidv4(),
      title: bookData.title,
      author: author || 'Unknown Author',
      description: bookData.description,
      genre: bookData.genre,
      subGenre: bookData.subGenre,
      tone: bookData.tone,
      heatLevel: bookData.heatLevel,
      perspective: bookData.perspective,
      status: 'draft',
      chapters: bookData.chapters.map((chapter: any, index: number) => ({
        id: uuidv4(),
        title: chapter.title,
        description: chapter.description,
        status: 'pending'
      }))
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse book outline from AI response. Please check your API key and try again.');
  }
};

export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<SubChapter[]> => {
  const prompt = `\nCreate a detailed outline for the following chapter:\n\nChapter Title: ${chapterTitle}\nChapter Description: ${chapterDescription}\n\nPlease provide a response in the following JSON format:\n{\n  "sections": [\n    {\n      "title": "Section Title",\n      "description": "Detailed description of what this section will cover (2-3 sentences)"\n    }\n  ]\n}\n\nGenerate 4-8 sections that comprehensively break down this chapter. Each section should be substantial enough to warrant its own content generation.\n\nIMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n`;

  const response = await callGeminiAPI(prompt, apiKey);
  
  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }
    
    const outlineData = JSON.parse(jsonMatch[0]);
    
    return outlineData.sections.map((section: any, index: number) => ({
      id: uuidv4(),
      title: section.title,
      description: section.description,
      status: 'pending'
    }));
  } catch (error) {
    console.error('Error parsing chapter outline:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse chapter outline from AI response. Please try again.');
  }
};

export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `\nWrite comprehensive, high-quality content for the following section:\n\nSection Title: ${sectionTitle}\nSection Description: ${sectionDescription}\n\nRequirements:\n- Structure the content with clear paragraphs\n- Make it suitable for an eBook format\n- Do not include markdown formatting or section headers\nPlease write the content now:\n`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};

export const generateBlogArticle = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `\nWrite a comprehensive, high-quality blog article for the following chapter:\n\nChapter Title: ${chapterTitle}\nChapter Description: ${chapterDescription}\n\nRequirements:\n- Structure the content with a clear introduction, body, and conclusion.\n- Use headings and subheadings to organize the content.\n- Write in an engaging and informative tone.\n- The article should be at least 800 words.\n- Do not include markdown formatting.\nPlease write the content now:\n`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};

export const generateLessonPlan = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `\nCreate a detailed lesson plan and script for a 15-20 minute presentation on the following topic:\n\nChapter Title: ${chapterTitle}\nChapter Description: ${chapterDescription}\n\nThe output should be in JSON format with the following structure:\n{\n  "title": "Presentation Title",\n  "slides": [\n    {\n      "title": "Slide Title",\n      "content": "Bulleted list of key points for the slide.",\n      "script": "The full script for this slide."\n    }\n  ]\n}\n\nGenerate 5-7 slides.\n\nIMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n`;

  const response = await callGeminiAPI(prompt, apiKey);
  
  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }
    
    return jsonMatch[0];
  } catch (error) {
    console.error('Error parsing lesson plan:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse lesson plan from AI response. Please try again.');
  }
};

export const generateContentWithHeatLevel = async (
  sectionTitle: string,
  sectionDescription: string,
  heatLevel: string,
  perspective: string = '',
  apiKey: string
): Promise<string> => {
  const heatLevelDescriptions = {
    'clean': 'Clean/Wholesome romance with no explicit sexual content, focusing on emotional connection, meaningful glances, hugs, and light kissing.',
    'sweet': 'Sweet romance with closed-door intimate scenes that are implied rather than explicit, focusing on emotional development.',
    'sensual': 'Sensual romance with on-page love scenes using euphemistic language, emphasizing emotional aspects over explicit details.',
    'steamy': 'Steamy romance with explicit sexual content and detailed intimate scenes throughout the story.',
    'spicy': 'Spicy/Erotic romance with heavy emphasis on sexual activity, detailed descriptions, and multiple intimate scenes.',
    'explicit': 'Explicit romance with highly detailed and graphic sexual content, exploring characters\' desires in depth.'
  };

  const heatLevelPrompt = heatLevelDescriptions[heatLevel as keyof typeof heatLevelDescriptions] || heatLevel;

  let perspectivePrompt = '';
  if (perspective) {
    const perspectiveDescriptions = {
      'first': 'Write in first person narrative (using "I" perspective).',
      'third-limited': 'Write in third person limited narrative (using "he/she" perspective), following one character\'s viewpoint.',
      'third-omniscient': 'Write in third person omniscient narrative (using "he/she" perspective), with access to multiple characters\' thoughts.',
      'second': 'Write in second person narrative (using "you" perspective).'
    };
    
    perspectivePrompt = `\nNarrative Perspective: ${perspectiveDescriptions[perspective as keyof typeof perspectiveDescriptions] || perspective}`;
  }

  const prompt = `\nWrite comprehensive, high-quality content for the following section:\n\nSection Title: ${sectionTitle}\nSection Description: ${sectionDescription}\n\nHeat Level Guidelines: ${heatLevelPrompt}\n${perspectivePrompt}\n\nRequirements:\n- Structure the content with clear paragraphs\n- Make it suitable for an eBook format\n- Adhere to the specified heat level throughout\n- Do not include markdown formatting or section headers\nPlease write the content now:\n`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};

export const analyzeContentAndGenerateTopics = async (content: string, apiKey: string): Promise<any> => {
  try {
    const prompt = `\nPlease analyze the following content from a WordPress blog. Based on the analysis, generate a list of 5 new, relevant, and SEO-friendly blog post topics.\n\nContent:\n${content}\n\nPlease provide a response in the following JSON format:\n{\n  "analysis": {\n    "writingStyle": "...",\n    "tone": "...",\n    "commonTopics": "...",\n    "seoPatterns": "..."\n  },\n  "suggestedTopics": [\n    {\n      "title": "...",\n      "description": "..."\n    }\n  ]\n}\n\nIMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n`;

    const response = await callGeminiAPI(prompt, apiKey);
    
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing content and generating topics:', error);
    throw new Error('Failed to analyze content and generate topics. Please check your API key and try again.');
  }
};

export const generateArticle = async (topicTitle: string, topicDescription: string, analysis: any, apiKey: string): Promise<string> => {
  const prompt = `\nPlease write a complete, SEO-optimized blog article based on the following topic and content analysis.\n\nTopic: ${topicTitle}\nDescription: ${topicDescription}\n\nContent Analysis:\n- Writing Style: ${analysis.writingStyle}\n- Tone: ${analysis.tone}\n- Common Topics: ${analysis.commonTopics}\n- SEO Patterns: ${analysis.seoPatterns}\n\nRequirements:\n- The article should be at least 800 words.\n- Use HTML formatting (e.g., <h2>, <p>, <ul>, <li>, <strong>).\n- The article should be engaging, informative, and well-structured.\n- The article should be SEO-optimized for the given topic.\n\nPlease write the article now:\n`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};