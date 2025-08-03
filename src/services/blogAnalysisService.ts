import { analyzeBlogContentWithAI } from './geminiService';

export interface BlogAnalysis {
  niche: string;
  topics: string[];
  categories: Array<{id: number, name: string, count: number}>;
  tags: string[];
  writingStyle: {
    tone: string;
    complexity: string;
    averageLength: number;
    commonStructures: string[];
  };
  contentTypes: Array<{
    type: string;
    frequency: number;
    examples: string[];
  }>;
  publishingPatterns: {
    frequency: string;
    bestDays: string[];
    averageWordsPerPost: number;
  };
  recommendations: {
    suggestedTopics: string[];
    contentGaps: string[];
    optimizations: string[];
  };
}

export interface ArticleGenerationPrompt {
  title: string;
  prompt: string;
  category: string;
  tags: string[];
  contentType: string;
  estimatedLength: number;
}

// Analyze existing blog content to understand niche and style
export const analyzeBlogContent = async (
  wordPressSiteUrl: string,
  username: string,
  appPassword: string,
  apiKey: string
): Promise<BlogAnalysis> => {
  
  try {
    console.log('🔍 Analyzing blog content...');
    
    // Fetch recent posts, categories, and tags
    const credentials = btoa(`${username}:${appPassword}`);
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };

    // Get recent posts (last 50)
    console.log('📡 Fetching recent posts...');
    const postsResponse = await fetch(`${wordPressSiteUrl}/wp-json/wp/v2/posts?per_page=50&status=publish`, {
      headers
    });

    if (!postsResponse.ok) {
      const errorText = await postsResponse.text();
      console.error('Failed to fetch posts:', postsResponse.status, errorText);
      throw new Error(`Failed to fetch posts: ${postsResponse.status} - ${errorText}`);
    }

    const posts = await postsResponse.json();
    console.log(`✅ Fetched ${posts.length} posts`);
    
    // Get categories
    console.log('📡 Fetching categories...');
    const categoriesResponse = await fetch(`${wordPressSiteUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers
    });
    const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
    if (!categoriesResponse.ok) {
      console.warn('Failed to fetch categories:', categoriesResponse.status);
    } else {
      console.log(`✅ Fetched ${categories.length} categories`);
    }

    // Get tags
    console.log('📡 Fetching tags...');
    const tagsResponse = await fetch(`${wordPressSiteUrl}/wp-json/wp/v2/tags?per_page=100`, {
      headers
    });
    const tags = tagsResponse.ok ? await tagsResponse.json() : [];
    if (!tagsResponse.ok) {
      console.warn('Failed to fetch tags:', tagsResponse.status);
    } else {
      console.log(`✅ Fetched ${tags.length} tags`);
    }

    console.log(`📊 Found ${posts.length} posts, ${categories.length} categories, ${tags.length} tags`);

    // Validate we have enough content to analyze
    if (posts.length === 0) {
      throw new Error('No published posts found. The blog needs at least one published post to analyze.');
    }

    // Prepare content for AI analysis
    const contentSample = posts.slice(0, 10).map(post => ({
      title: post.title.rendered,
      content: post.content.rendered.replace(/<[^>]*>/g, '').substring(0, 500), // Strip HTML, limit length
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
      categories: post.categories,
      tags: post.tags
    }));

    console.log(`🔍 Prepared ${contentSample.length} posts for analysis`);

    // Create analysis prompt
    const analysisPrompt = `
Analyze this blog's content and provide insights about its niche, style, and content patterns.

Blog Posts Sample:
${contentSample.map((post, i) => `
Post ${i + 1}:
Title: ${post.title}
Excerpt: ${post.excerpt}
Content Preview: ${post.content}
---`).join('\n')}

Categories Available: ${categories.map(cat => cat.name).join(', ')}
Tags Available: ${tags.map(tag => tag.name).slice(0, 20).join(', ')}

Please analyze and provide a JSON response with the following structure:
{
  "niche": "Primary niche/industry (e.g., 'Technology', 'Health & Wellness', 'Business')",
  "topics": ["list", "of", "main", "topics", "covered"],
  "writingStyle": {
    "tone": "professional/casual/conversational/academic",
    "complexity": "beginner/intermediate/advanced",
    "averageLength": estimated_word_count_per_post,
    "commonStructures": ["how-to", "listicle", "opinion", "news", "tutorial"]
  },
  "contentTypes": [
    {
      "type": "How-to Guides",
      "frequency": 30,
      "examples": ["example titles"]
    }
  ],
  "publishingPatterns": {
    "frequency": "daily/weekly/monthly",
    "averageWordsPerPost": estimated_average
  },
  "recommendations": {
    "suggestedTopics": ["new", "topic", "ideas", "based", "on", "niche"],
    "contentGaps": ["areas", "not", "covered", "yet"],
    "optimizations": ["suggestions", "for", "improvement"]
  }
}

Focus on identifying the core niche, writing style, and content patterns to help generate similar high-quality content.
`;

    console.log('🤖 Sending content to AI for analysis...');

    const aiResponse = await analyzeBlogContentWithAI(analysisPrompt, apiKey);
    
    // Extract JSON from AI response
    console.log('🔍 Parsing AI response...');
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', aiResponse.substring(0, 500));
      throw new Error('Could not extract analysis data from AI response');
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed AI response');
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('JSON string:', jsonMatch[0].substring(0, 500));
      throw new Error('Invalid JSON in AI response');
    }
    
    // Enhance with actual WordPress data
    const enhancedAnalysis: BlogAnalysis = {
      ...analysis,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat.count || 0
      })),
      tags: tags.map(tag => tag.name).slice(0, 50), // Limit to top 50 tags
      publishingPatterns: {
        ...analysis.publishingPatterns,
        bestDays: calculateBestPublishingDays(posts),
        averageWordsPerPost: calculateAverageWordCount(posts)
      }
    };

    console.log('✅ Blog analysis complete');
    return enhancedAnalysis;
    
  } catch (error) {
    console.error('Error analyzing blog content:', error);
    throw new Error(`Blog analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate article ideas based on blog analysis
export const generateArticleIdeas = async (
  analysis: BlogAnalysis,
  count: number,
  apiKey: string
): Promise<ArticleGenerationPrompt[]> => {
  
  const ideaPrompt = `
Based on this blog analysis, generate ${count} unique article ideas that would fit perfectly with the existing content:

Blog Niche: ${analysis.niche}
Main Topics: ${analysis.topics.join(', ')}
Writing Style: ${analysis.writingStyle.tone}, ${analysis.writingStyle.complexity} level
Average Length: ${analysis.writingStyle.averageLength} words
Content Types: ${analysis.contentTypes.map(ct => ct.type).join(', ')}
Available Categories: ${analysis.categories.map(cat => cat.name).join(', ')}

Generate articles that:
1. Match the existing niche and topics
2. Use similar writing style and tone
3. Rotate between different content types
4. Use existing categories appropriately
5. Are unique and valuable to the audience

For each article, provide:
{
  "articles": [
    {
      "title": "Compelling article title",
      "prompt": "Detailed prompt for AI to generate the full article content",
      "category": "Category name from available categories",
      "tags": ["relevant", "tags", "for", "article"],
      "contentType": "how-to/listicle/guide/opinion/news/tutorial",
      "estimatedLength": word_count_number
    }
  ]
}

Make sure each article idea is unique, valuable, and perfectly aligned with the blog's existing content style.
`;

  try {
    const response = await analyzeBlogContentWithAI(ideaPrompt, apiKey);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract article ideas from AI response');
    }
    
    const ideas = JSON.parse(jsonMatch[0]);
    return ideas.articles || [];
    
  } catch (error) {
    console.error('Error generating article ideas:', error);
    throw new Error(`Article idea generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate a single article based on the blog's style
export const generateBlogStyleArticle = async (
  prompt: ArticleGenerationPrompt,
  analysis: BlogAnalysis,
  apiKey: string
): Promise<{title: string, content: string, excerpt: string}> => {
  
  const articlePrompt = `
Write a complete article for a ${analysis.niche} blog with the following specifications:

Title: ${prompt.title}
Content Type: ${prompt.contentType}
Target Length: ${prompt.estimatedLength} words
Writing Style: ${analysis.writingStyle.tone}, ${analysis.writingStyle.complexity} level

Article Requirements:
${prompt.prompt}

Style Guidelines:
- Match the blog's ${analysis.writingStyle.tone} tone
- Write at ${analysis.writingStyle.complexity} complexity level
- Target approximately ${prompt.estimatedLength} words
- Use ${prompt.contentType} structure
- Include actionable insights and value for readers
- Write in HTML format suitable for WordPress

Please provide the response in this JSON format:
{
  "title": "Final article title",
  "content": "Complete article content in HTML format with proper headings, paragraphs, and structure",
  "excerpt": "Brief 2-3 sentence summary for the article excerpt"
}

Make sure the content is high-quality, engaging, and perfectly matches the existing blog's style and niche.
`;

  try {
    const response = await analyzeBlogContentWithAI(articlePrompt, apiKey);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract article content from AI response');
    }
    
    const article = JSON.parse(jsonMatch[0]);
    return {
      title: article.title || prompt.title,
      content: article.content || '',
      excerpt: article.excerpt || ''
    };
    
  } catch (error) {
    console.error('Error generating article:', error);
    throw new Error(`Article generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper functions
const calculateBestPublishingDays = (posts: any[]): string[] => {
  const dayCount: Record<string, number> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  posts.forEach(post => {
    const date = new Date(post.date);
    const dayName = days[date.getDay()];
    dayCount[dayName] = (dayCount[dayName] || 0) + 1;
  });
  
  return Object.entries(dayCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([day]) => day);
};

const calculateAverageWordCount = (posts: any[]): number => {
  if (posts.length === 0) return 800; // Default
  
  const totalWords = posts.reduce((sum, post) => {
    const content = post.content.rendered.replace(/<[^>]*>/g, '');
    const wordCount = content.split(/\s+/).length;
    return sum + wordCount;
  }, 0);
  
  return Math.round(totalWords / posts.length);
};

// Quick niche detection for immediate feedback
export const quickNicheDetection = async (
  wordPressSiteUrl: string,
  username: string,
  appPassword: string,
  apiKey: string
): Promise<{niche: string, confidence: number, topics: string[]}> => {
  
  try {
    const credentials = btoa(`${username}:${appPassword}`);
    
    // Get just the latest 5 posts for quick analysis
    const response = await fetch(`${wordPressSiteUrl}/wp-json/wp/v2/posts?per_page=5&status=publish`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts for niche detection');
    }
    
    const posts = await response.json();
    
    const titles = posts.map((post: any) => post.title.rendered).join('\n');
    
    const nichePrompt = `
Analyze these blog post titles and identify the primary niche/industry:

${titles}

Respond with JSON:
{
  "niche": "Primary niche (e.g., Technology, Health, Business)",
  "confidence": confidence_score_0_to_100,
  "topics": ["main", "topics", "identified"]
}
`;
    
    const aiResponse = await analyzeBlogContentWithAI(nichePrompt, apiKey);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      niche: 'General',
      confidence: 50,
      topics: ['General Content']
    };
    
  } catch (error) {
    console.error('Quick niche detection failed:', error);
    return {
      niche: 'General',
      confidence: 0,
      topics: ['General Content']
    };
  }
};
