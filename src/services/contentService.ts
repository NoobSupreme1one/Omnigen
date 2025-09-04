import { Book, BookChapter, SubChapter } from '../types';
import { generateContent as openRouterGenerateContent, researchTopic } from './openRouterService';
import { v4 as uuidv4 } from 'uuid';

// Generate chapter outline
export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string
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
    const response = await openRouterGenerateContent(prompt, undefined, 1024, 0.7);
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]);
      return sections.map((section: any, index: number) => ({
        id: uuidv4(),
        title: section.title,
        description: section.description,
        content: '',
        status: 'pending' as const,
        orderIndex: index
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
    console.warn('Failed to parse chapter outline JSON, using fallback');
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

// Generate content for a section
export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string
): Promise<string> => {
  const prompt = `Write comprehensive, high-quality content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Requirements:
- Structure the content with clear paragraphs
- Make it suitable for an eBook format
- Do not include markdown formatting or section headers
Please write the content now:`;

  return await openRouterGenerateContent(prompt, undefined);
};

// Generate content with heat level for romance books
export const generateContentWithHeatLevel = async (
  sectionTitle: string,
  sectionDescription: string,
  heatLevel: string,
  perspective: string = ''
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
Please write the content now:`;

  return await openRouterGenerateContent(prompt, undefined);
};

export const researchAndGenerate = async (
  title: string,
  description: string,
  apiKeys: {gemini: string; perplexity: string}
): Promise<string> => {
  // First, research the topic
  const researchData = await researchTopic(title, description, apiKeys.perplexity);
  
  // Then generate content based on research
  const enhancedDescription = `${description}

Research findings:
${researchData}

Use the above research to create comprehensive, well-informed content.`;
  
  return await openRouterGenerateContent(enhancedDescription, apiKeys.perplexity);
};

export const generateAllContent = async (
  book: Book,
  geminiApiKey: string,
  onProgress: (book: Book) => void
): Promise<Book> => {
  let updatedBook = { ...book };

  for (let i = 0; i < updatedBook.chapters.length; i++) {
    const chapter = updatedBook.chapters[i];
    
    // Generate chapter outline if not exists
    if (!chapter.subChapters) {
      const outline = await generateChapterOutline(chapter.title, chapter.description, geminiApiKey);
      chapter.subChapters = outline;
      onProgress({ ...updatedBook });
    }

    // Generate content for each sub-chapter
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...updatedBook });
        
        // Generate content
        const content = await generateContent(subChapter.title, subChapter.description, geminiApiKey);
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...updatedBook });
        
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...updatedBook });
  }

  return updatedBook;
};

export const generateAllContentWithResearch = async (
  book: Book,
  apiKeys: {gemini: string; perplexity: string},
  onProgress: (book: Book) => void
): Promise<Book> => {
  let updatedBook = { ...book };

  for (let i = 0; i < updatedBook.chapters.length; i++) {
    const chapter = updatedBook.chapters[i];
    
    // Generate chapter outline if not exists
    if (!chapter.subChapters) {
      const outline = await generateChapterOutline(chapter.title, chapter.description);
      chapter.subChapters = outline;
      onProgress({ ...updatedBook });
    }

    // Generate content for each sub-chapter with research
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...updatedBook });
        
        // Research and generate content
        const content = await researchAndGenerate(subChapter.title, subChapter.description, apiKeys);
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...updatedBook });
        
        // Longer delay for research calls to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...updatedBook });
  }

  return updatedBook;
};

export const convertRomanceHeatLevel = async (
  originalBook: Book,
  newHeatLevel: string,
  apiKeys: {gemini: string; perplexity: string},
  onProgress: (book: Book) => void
): Promise<Book> => {
  // Create a new book with updated heat level
  const heatLevelLabels: {[key: string]: string} = {
    'clean': 'Clean',
    'sweet': 'Sweet', 
    'sensual': 'Sensual',
    'steamy': 'Steamy',
    'spicy': 'Spicy',
    'explicit': 'Explicit'
  };

  const newBook: Book = {
    ...originalBook,
    id: uuidv4(),
    title: `${originalBook.title} - ${heatLevelLabels[newHeatLevel]} Version`,
    subGenre: originalBook.subGenre,
    heatLevel: newHeatLevel,
    perspective: originalBook.perspective,
    tone: originalBook.tone,
    status: 'generating',
    chapters: originalBook.chapters.map(chapter => ({
      ...chapter,
      id: uuidv4(),
      status: 'pending',
      subChapters: chapter.subChapters?.map(subChapter => ({
        ...subChapter,
        id: uuidv4(),
        status: 'pending',
        content: undefined // Clear existing content
      }))
    }))
  };

  onProgress(newBook);

  // Regenerate all content with new heat level
  for (let i = 0; i < newBook.chapters.length; i++) {
    const chapter = newBook.chapters[i];
    
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...newBook });
        
        // Generate content with new heat level context
        const content = await generateContentWithHeatLevel(
          subChapter.title, 
          subChapter.description, 
          newHeatLevel,
          originalBook.perspective || ''
        );
        
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...newBook });
        
        // Delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...newBook });
  }

  newBook.status = 'completed';
  return newBook;
};
