import { Book, BookChapter, SubChapter } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { generateOnlineCourse } from './onlineCourseService';
import * as PerplexityService from './perplexityService';

// This service now uses OpenRouter API for all text generation
// Maintaining the same function signatures for backward compatibility

import { generateContent as openRouterGenerateContent } from './openRouterService';

// Legacy function - now redirects to OpenRouter
const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  console.log('🔄 Redirecting Gemini API call to OpenRouter...');
  return await openRouterGenerateContent(prompt, apiKey, 2048, 0.7);
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

  const response = await openRouterGenerateContent(fullPrompt, apiKey, 4096, 0.8);
  
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

  try {
    const response = await openRouterGenerateContent(prompt, apiKey, 1024, 0.7);
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]);
      return sections.map((section: any) => ({
        id: uuidv4(),
        title: section.title,
        description: section.description,
        content: '',
        status: 'pending' as const,
        orderIndex: 0
      }));
    }

    // Fallback: create basic sections
    return [{
      id: uuidv4(),
      title: `${chapterTitle} - Part 1`,
      description: chapterDescription,
      content: '',
      status: 'pending' as const,
      orderIndex: 0
    }];
  } catch (error) {
    console.error('Error generating chapter outline:', error);
    // Return a default structure if generation fails
    return [{
      id: uuidv4(),
      title: `${chapterTitle} - Part 1`,
      description: chapterDescription,
      content: '',
      status: 'pending' as const,
      orderIndex: 0
    }];
  }
};

export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Write comprehensive, high-quality content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Requirements:
- Structure the content with clear paragraphs
- Make it suitable for an eBook format
- Do not include markdown formatting or section headers
Please write the content now:`;

  return await openRouterGenerateContent(prompt, apiKey);
};

export const generateBlogArticle = async (
  chapterTitle: string,
  chapterDescription: string
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

  return await openRouterGenerateContent(prompt, undefined, 3072, 0.7);
};

export const generateLessonPlan = async (
  chapterTitle: string,
  chapterDescription: string
): Promise<string> => {
  const prompt = `Create a detailed lesson plan and script for a 15-20 minute presentation on the following topic:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

The output should be in JSON format with the following structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": "Bulleted list of key points for the slide.",
      "script": "The full script for this slide."
    }
  ]
}

Generate 5-7 slides.

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

  const response = await openRouterGenerateContent(prompt, undefined, 2048, 0.7);

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

  return await openRouterGenerateContent(prompt, apiKey);
};

export const analyzeContentAndGenerateTopics = async (content: string, apiKey: string): Promise<any> => {
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

  try {
    const response = await openRouterGenerateContent(prompt, undefined, 2048, 0.7);

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
    console.error('Error analyzing content and generating topics:', error);
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

export const generateArticle = async (topicTitle: string, topicDescription: string, analysis: any, apiKey: string): Promise<string> => {
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

  return await openRouterGenerateContent(prompt, apiKey, 3072, 0.7);
};

// Blog analysis function specifically for analyzing WordPress blog content
export const analyzeBlogContentWithAI = async (analysisPrompt: string, apiKey: string): Promise<string> => {
  try {
    console.log('🤖 Calling OpenRouter API for blog analysis...');
    const response = await openRouterGenerateContent(analysisPrompt, apiKey, 2048, 0.7);
    console.log('✅ OpenRouter API response received');
    return response;
  } catch (error) {
    console.error('Error in blog analysis AI call:', error);
    throw new Error(`Blog analysis AI call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};