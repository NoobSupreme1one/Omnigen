import { ArticleTemplate, ScheduledArticle, WritingPersona } from '../types';
import { generateContent as openRouterGenerateContent } from './openRouterService';
import { generateBookCover } from './coverService';
import { generateContentWithPersona } from './personaService';

// Generate article content from template
export const generateArticleFromTemplate = async (
  template: ArticleTemplate,
  apiKey: string,
  customVariables?: Record<string, string>
): Promise<{title: string, content: string, seoTitle?: string, seoDescription?: string}> => {
  
  // Replace template variables
  let prompt = template.promptTemplate;
  
  // Replace custom variables if provided
  if (customVariables) {
    Object.entries(customVariables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
  }
  
  // Replace built-in variables
  const now = new Date();
  const dateVariables = {
    'current_date': now.toLocaleDateString(),
    'current_month': now.toLocaleDateString('en-US', { month: 'long' }),
    'current_year': now.getFullYear().toString(),
    'current_day': now.toLocaleDateString('en-US', { weekday: 'long' }),
  };
  
  Object.entries(dateVariables).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Enhanced prompt for article generation
  const enhancedPrompt = `
${prompt}

Please generate a comprehensive article with the following structure:
1. An engaging title
2. Well-structured content with proper headings and paragraphs
3. SEO-optimized content
4. Include relevant examples and actionable insights

Format the response as JSON:
{
  "title": "Article Title",
  "content": "Full article content in HTML format",
  "seoTitle": "SEO-optimized title (60 chars max)",
  "seoDescription": "SEO meta description (160 chars max)"
}
`;

  try {
    let generatedContent: string;
    
    // Use persona if available
    if (template.writingPersona) {
      generatedContent = await generateContentWithPersona(enhancedPrompt, template.writingPersona, apiKey);
    } else {
      generatedContent = await openRouterGenerateContent(enhancedPrompt, apiKey);
    }
    
    // Extract JSON from response
    const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract article data from AI response');
    }
    
    const articleData = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!articleData.title || !articleData.content) {
      throw new Error('Generated article missing required fields');
    }
    
    return {
      title: articleData.title,
      content: articleData.content,
      seoTitle: articleData.seoTitle,
      seoDescription: articleData.seoDescription,
    };
    
  } catch (error) {
    console.error('Error generating article from template:', error);
    throw new Error(`Failed to generate article: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate featured image for article
export const generateFeaturedImage = async (
  template: ArticleTemplate,
  articleTitle: string,
  apiKey: string
): Promise<string> => {
  
  let imagePrompt = template.featuredImagePrompt || 
    `Create a professional featured image for an article titled "${articleTitle}". 
     The image should be visually appealing, relevant to the content, and suitable for a blog post.
     Style: Modern, clean, professional. Aspect ratio: 16:9 for featured image use.`;
  
  // Replace variables in image prompt
  imagePrompt = imagePrompt.replace(/{{article_title}}/g, articleTitle);
  
  try {
    // Create a mock book object for the cover service
    const mockBook = {
      id: 'temp',
      title: articleTitle,
      author: 'Blog Author',
      description: imagePrompt,
      genre: 'Blog',
      tone: 'Professional',
      chapters: [],
      status: 'draft' as const,
    };
    
    const imageUrl = await generateBookCover(mockBook, apiKey);
    return imageUrl;
    
  } catch (error) {
    console.error('Error generating featured image:', error);
    throw new Error(`Failed to generate featured image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate SEO-optimized tags from content
export const generateSEOTags = async (
  title: string,
  content: string,
  apiKey: string
): Promise<{tags: string[], categories: string[]}> => {
  
  const seoPrompt = `
Analyze this article and generate SEO-optimized tags and categories:

Title: ${title}
Content: ${content.substring(0, 1000)}...

Generate:
1. 5-10 relevant tags for WordPress
2. 2-3 main categories

Format as JSON:
{
  "tags": ["tag1", "tag2", "tag3"],
  "categories": ["category1", "category2"]
}
`;

  try {
    const response = await openRouterGenerateContent(seoPrompt, apiKey);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to basic tags
      return {
        tags: [title.split(' ').slice(0, 3).join(' ')],
        categories: ['Blog']
      };
    }
    
    const seoData = JSON.parse(jsonMatch[0]);
    return {
      tags: seoData.tags || [],
      categories: seoData.categories || ['Blog']
    };
    
  } catch (error) {
    console.error('Error generating SEO tags:', error);
    // Return fallback tags
    return {
      tags: [title.split(' ').slice(0, 3).join(' ')],
      categories: ['Blog']
    };
  }
};

// Process template variables for dynamic content
export const processTemplateVariables = (
  template: string,
  variables: Record<string, string> = {}
): string => {
  let processed = template;
  
  // Built-in variables
  const now = new Date();
  const builtInVars = {
    'current_date': now.toLocaleDateString(),
    'current_month': now.toLocaleDateString('en-US', { month: 'long' }),
    'current_year': now.getFullYear().toString(),
    'current_day': now.toLocaleDateString('en-US', { weekday: 'long' }),
    'current_time': now.toLocaleTimeString(),
    'random_number': Math.floor(Math.random() * 1000).toString(),
  };
  
  // Merge custom and built-in variables
  const allVariables = { ...builtInVars, ...variables };
  
  // Replace all variables
  Object.entries(allVariables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  });
  
  return processed;
};

// Validate article template
export const validateArticleTemplate = (template: ArticleTemplate): string[] => {
  const errors: string[] = [];
  
  if (!template.name?.trim()) {
    errors.push('Template name is required');
  }
  
  if (!template.promptTemplate?.trim()) {
    errors.push('Prompt template is required');
  }
  
  if (template.promptTemplate && template.promptTemplate.length < 50) {
    errors.push('Prompt template should be at least 50 characters long');
  }
  
  // Check for valid template variables
  const variablePattern = /{{(\w+)}}/g;
  const variables = template.promptTemplate?.match(variablePattern) || [];
  const validVariables = [
    'current_date', 'current_month', 'current_year', 'current_day', 
    'current_time', 'random_number', 'article_title'
  ];
  
  variables.forEach(variable => {
    const varName = variable.replace(/[{}]/g, '');
    if (!validVariables.includes(varName)) {
      errors.push(`Unknown template variable: ${variable}. Valid variables: ${validVariables.join(', ')}`);
    }
  });
  
  return errors;
};

// Generate article preview (without full generation)
export const generateArticlePreview = async (
  template: ArticleTemplate,
  apiKey: string
): Promise<{title: string, excerpt: string}> => {
  
  const previewPrompt = `
Based on this article template, generate a preview:
${template.promptTemplate}

Generate only:
1. A compelling title
2. A 2-3 sentence excerpt/summary

Format as JSON:
{
  "title": "Article Title",
  "excerpt": "Brief excerpt describing what the article will cover..."
}
`;

  try {
    const response = await openRouterGenerateContent(previewPrompt, apiKey);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract preview data from AI response');
    }
    
    const previewData = JSON.parse(jsonMatch[0]);
    
    return {
      title: previewData.title || 'Generated Article',
      excerpt: previewData.excerpt || 'AI-generated article content...'
    };
    
  } catch (error) {
    console.error('Error generating article preview:', error);
    return {
      title: 'Generated Article',
      excerpt: 'AI-generated article content based on your template...'
    };
  }
};
