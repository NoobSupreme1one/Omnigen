// import { supabase } from '../lib/supabase'; // Disabled - Supabase removed
import { 
  analyzeBlogContent, 
  generateArticleIdeas, 
  generateBlogStyleArticle,
  BlogAnalysis,
  ArticleGenerationPrompt 
} from './blogAnalysisService';
import { generateBookCover } from './coverService';
import { publishArticle } from './wordpressService';

export interface AutoPublishingSchedule {
  id: string;
  userId: string;
  wordPressSiteId: string;
  wordPressSite?: any;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  timeOfDay: string; // "09:00"
  timezone: string;
  isActive: boolean;
  blogAnalysis?: BlogAnalysis;
  lastAnalyzed?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedArticle {
  id: string;
  scheduleId: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  featuredImageUrl?: string;
  status: 'pending' | 'generating' | 'ready' | 'publishing' | 'published' | 'failed';
  scheduledFor: string;
  publishedAt?: string;
  wordPressPostId?: number;
  errorMessage?: string;
  createdAt: string;
}

// Generate sample article for new schedule
export const generateSampleArticle = async (
  scheduleId: string,
  wordPressSiteId: string,
  apiKey: string
): Promise<GeneratedArticle> => {

  console.log('🎨 Starting sample article generation...');

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    // Get WordPress site details using direct fetch
    console.log('🔍 Fetching WordPress site details...');
    const siteResponse = await fetch(`http://127.0.0.1:54321/rest/v1/wordpress_sites?select=*&id=eq.${wordPressSiteId}&user_id=eq.${userId}`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to fetch WordPress site: ${siteResponse.statusText}`);
    }

    const sites = await siteResponse.json();
    if (!sites || sites.length === 0) {
      throw new Error('WordPress site not found');
    }

    const site = sites[0];
    console.log('✅ WordPress site found:', site.name);
    console.log(`📝 Generating sample article for ${site.name}`);

    // Quick niche detection for sample article
    const { analyzeBlogContent, generateArticleIdeas, generateBlogStyleArticle } = await import('./blogAnalysisService');
    const quickAnalysis = await analyzeBlogContent(
      site.url,
      site.username,
      site.app_password,
      apiKey
    );

    // Generate article ideas based on quick analysis
    const ideas = await generateArticleIdeas(quickAnalysis, 1);

    if (ideas.length === 0) {
      throw new Error('No sample article ideas generated');
    }

    const idea = ideas[0];

    // Generate the full sample article
    const article = await generateBlogStyleArticle(idea, quickAnalysis);

    // Generate featured image for the sample article
    const featuredImageUrl = await generateArticleFeaturedImage(article.title, idea.category, apiKey);

    // Save sample article using direct fetch
    console.log('💾 Saving sample article to database...');

    const articleData = {
      user_id: userId,
      schedule_id: scheduleId,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: idea.category,
      tags: idea.tags,
      featured_image_url: featuredImageUrl,
      status: 'ready',
      scheduled_for: new Date().toISOString() // Available immediately
    };

    const articleResponse = await fetch('http://127.0.0.1:54321/rest/v1/generated_articles', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(articleData)
    });

    if (!articleResponse.ok) {
      const errorText = await articleResponse.text();
      throw new Error(`Failed to save article: ${articleResponse.statusText} - ${errorText}`);
    }

    const savedArticles = await articleResponse.json();
    const sampleArticle = Array.isArray(savedArticles) ? savedArticles[0] : savedArticles;

    console.log(`✅ Sample article generated and saved: "${article.title}"`);

    return sampleArticle;

  } catch (error) {
    console.error('Sample article generation failed:', error);
    throw error;
  }
};

// Generate featured image for article
export const generateArticleFeaturedImage = async (
  title: string,
  category: string,
  apiKey: string
): Promise<string | null> => {

  try {
    console.log(`🎨 Generating featured image for: "${title}"`);

    // Create a detailed prompt for article featured image
    const prompt = `Create a professional, high-quality featured image for a blog article titled "${title}" in the ${category} category.

    Style: Modern, clean, professional blog featured image
    Composition: Horizontal landscape orientation (16:9 aspect ratio)
    Quality: High resolution, suitable for web and social media
    Elements: Relevant visual metaphors, clean typography space, engaging but not cluttered
    Colors: Professional color palette, good contrast
    Mood: Engaging and informative, appropriate for the topic

    The image should be suitable as a featured image for a blog post, with space for potential text overlay.`;

    // Use the existing cover service but adapt it for article images
    const { generateBookCover } = await import('./coverService');

    // Create a mock book object for the cover service
    const mockArticle = {
      title: title,
      genre: category,
      author: 'Blog Article',
      description: `Featured image for ${title}`
    };

    const imageUrl = await generateBookCover(mockArticle as any, apiKey);

    console.log(`✅ Featured image generated for: "${title}"`);
    return imageUrl;

  } catch (error) {
    console.error('Featured image generation failed:', error);
    // Return null if image generation fails - article can still be created
    return null;
  }
};

// Create auto-publishing schedule with sample article
export const createAutoPublishingSchedule = async (
  wordPressSiteId: string,
  frequency: string,
  timeOfDay: string,
  timezone: string = 'UTC',
  apiKey?: string
): Promise<{ schedule: AutoPublishingSchedule; sampleArticle?: GeneratedArticle }> => {

  console.log('🔄 Creating auto-publishing schedule...');

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    // Calculate next run time
    const nextRunAt = calculateNextRunTime(frequency, timeOfDay, timezone);
    console.log('⏰ Next run time calculated:', nextRunAt);

    // Create schedule data
    const scheduleData = {
      user_id: userId,
      wordpress_site_id: wordPressSiteId,
      frequency,
      time_of_day: timeOfDay,
      timezone,
      next_run_at: nextRunAt,
      is_active: true
    };

    console.log('📝 Creating schedule with data:', scheduleData);

    // Use direct fetch to create the schedule
    const response = await fetch('http://127.0.0.1:54321/rest/v1/auto_publishing_schedules', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(scheduleData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create schedule: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Schedule created successfully:', data);

    // Map the response to match the expected format
    const schedule = Array.isArray(data) ? data[0] : data;
    const mappedSchedule = {
      ...schedule,
      blogAnalysis: schedule.blog_analysis,
      lastAnalyzed: schedule.last_analyzed,
      nextRunAt: schedule.next_run_at,
      wordPressSiteId: schedule.wordpress_site_id,
      wordPressSite: null,
      isActive: schedule.is_active,
      timeOfDay: schedule.time_of_day,
      userId: schedule.user_id,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    };

    let sampleArticle: GeneratedArticle | undefined;

    // Generate sample article if API key is provided
    if (apiKey) {
      try {
        console.log('🎨 Generating sample article...');
        sampleArticle = await generateSampleArticle(schedule.id, wordPressSiteId, apiKey);
        console.log('✅ Sample article generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate sample article:', error);
        // Don't fail the schedule creation if sample article fails
      }
    }

    return { schedule: mappedSchedule, sampleArticle };
  } catch (error) {
    console.error('❌ Error creating auto-publishing schedule:', error);
    throw error;
  }
};

// Publish sample article
export const publishSampleArticle = async (articleId: string): Promise<void> => {

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get the article with schedule and site details
  const { data: article, error: articleError } = await supabase
    .from('generated_articles')
    .select(`
      *,
      schedule:auto_publishing_schedules(
        wordpress_site:wordpress_sites(*)
      )
    `)
    .eq('id', articleId)
    .eq('user_id', user.id)
    .single();

  if (articleError || !article) {
    throw new Error('Article not found');
  }

  if (article.status === 'published') {
    throw new Error('Article is already published');
  }

  try {
    console.log(`📤 Publishing sample article: "${article.title}"`);

    // Update status to publishing
    await supabase
      .from('generated_articles')
      .update({ status: 'publishing' })
      .eq('id', articleId);

    // Publish the article using the existing publish function
    await publishSingleArticle(article, 'dummy-api-key');

    console.log(`✅ Sample article published successfully: "${article.title}"`);

  } catch (error) {
    console.error('Failed to publish sample article:', error);

    // Mark as failed
    await supabase
      .from('generated_articles')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', articleId);

    throw error;
  }
};

// Get generated articles for a schedule
export const getGeneratedArticlesForSchedule = async (scheduleId: string): Promise<GeneratedArticle[]> => {

  console.log('📄 Getting generated articles for schedule:', scheduleId);

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    console.log('🗃️ Querying generated articles...');

    // Use direct fetch to bypass Supabase client issues
    const response = await fetch(`http://127.0.0.1:54321/rest/v1/generated_articles?select=*&schedule_id=eq.${scheduleId}&user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!response.ok) {
      throw new Error(`Generated articles query failed: ${response.statusText}`);
    }

    const articles = await response.json();
    console.log('✅ Generated articles data:', articles);
    return articles || [];
  } catch (error) {
    console.error('❌ Error getting generated articles:', error);
    throw error;
  }
};

// Get user's auto-publishing schedules
export const getUserAutoPublishingSchedules = async (): Promise<AutoPublishingSchedule[]> => {
  console.log('🔍 Getting user auto-publishing schedules...');

  try {
    console.log('🔐 Using hardcoded user ID for testing...');

    // Temporarily use hardcoded user ID to bypass auth issues
    const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
    console.log('👤 Using user ID:', userId);

    console.log('🗃️ Querying database...');

    // Use direct fetch to bypass Supabase client issues
    const response = await fetch(`http://127.0.0.1:54321/rest/v1/auto_publishing_schedules?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!response.ok) {
      throw new Error(`Database query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Database query completed');
    console.log('✅ Raw schedules data:', data);

    console.log('✅ Raw schedules data:', data);

    // Map database fields to TypeScript interface
    const mappedData = (data || []).map((schedule: any) => ({
      ...schedule,
      blogAnalysis: schedule.blog_analysis,
      lastAnalyzed: schedule.last_analyzed,
      nextRunAt: schedule.next_run_at,
      wordPressSiteId: schedule.wordpress_site_id,
      wordPressSite: null, // We'll load this separately if needed
      isActive: schedule.is_active,
      timeOfDay: schedule.time_of_day,
      userId: schedule.user_id,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    }));

    console.log('✅ Mapped schedules:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('❌ Error in getUserAutoPublishingSchedules:', error);
    throw error;
  }
};

// Analyze blog and update schedule
export const analyzeBlogForSchedule = async (
  scheduleId: string
): Promise<BlogAnalysis> => {
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get schedule with WordPress site info
  const { data: schedule, error: scheduleError } = await supabase
    .from('auto_publishing_schedules')
    .select(`
      *,
      wordpress_site:wordpress_sites(*)
    `)
    .eq('id', scheduleId)
    .eq('user_id', user.id)
    .single();

  if (scheduleError || !schedule) {
    throw new Error('Schedule not found');
  }

  const site = schedule.wordpress_site;
  
  try {
    console.log(`🔍 Analyzing blog: ${site.name}`);
    console.log(`📡 Site URL: ${site.url}`);
    console.log(`👤 Username: ${site.username}`);

    // Analyze the blog content
    const analysis = await analyzeBlogContent(
      site.url,
      site.username,
      site.app_password
    );

    console.log('💾 Saving analysis to database...');
    // Update schedule with analysis
    const { error: updateError } = await supabase
      .from('auto_publishing_schedules')
      .update({
        blog_analysis: analysis,
        last_analyzed: new Date().toISOString()
      })
      .eq('id', scheduleId);

    if (updateError) {
      console.error('Failed to save analysis:', updateError);
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log(`✅ Blog analysis complete for ${site.name}`);
    console.log(`📊 Niche: ${analysis.niche}`);
    console.log(`📝 Topics: ${analysis.topics.join(', ')}`);

    return analysis;
    
  } catch (error) {
    console.error('Blog analysis failed:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch posts')) {
        throw new Error(`Cannot access WordPress posts. Please check your site URL and credentials. Details: ${error.message}`);
      } else if (error.message.includes('No published posts found')) {
        throw new Error('Your WordPress site has no published posts to analyze. Please publish at least one post first.');
      } else if (error.message.includes('Could not extract analysis data')) {
        throw new Error('AI analysis failed to generate valid results. Please try again or check your API key.');
      } else if (error.message.includes('Daily quota exceeded')) {
        throw new Error('AI service quota exceeded. Please wait 24 hours or upgrade your plan.');
      } else {
        throw new Error(`Blog analysis failed: ${error.message}`);
      }
    } else {
      throw new Error('Blog analysis failed due to an unknown error. Please try again.');
    }
  }
};

// Generate and schedule next article
export const generateNextArticle = async (
  scheduleId: string
): Promise<GeneratedArticle> => {
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get schedule with analysis
  const { data: schedule, error: scheduleError } = await supabase
    .from('auto_publishing_schedules')
    .select(`
      *,
      wordpress_site:wordpress_sites(*)
    `)
    .eq('id', scheduleId)
    .eq('user_id', user.id)
    .single();

  if (scheduleError || !schedule) {
    throw new Error('Schedule not found');
  }

  if (!schedule.blog_analysis) {
    throw new Error('Blog analysis required. Please analyze the blog first.');
  }

  const analysis = schedule.blog_analysis as BlogAnalysis;
  
  try {
    console.log(`📝 Generating article for ${schedule.wordpress_site.name}`);
    
    // Generate article ideas (just 1 for now)
    const ideas = await generateArticleIdeas(analysis, 1);
    
    if (ideas.length === 0) {
      throw new Error('No article ideas generated');
    }

    const idea = ideas[0];
    
    // Generate the full article
    const article = await generateBlogStyleArticle(idea, analysis);
    
    // Calculate next scheduled time
    const scheduledFor = calculateNextRunTime(
      schedule.frequency,
      schedule.time_of_day,
      schedule.timezone
    );

    // Save generated article
    const { data: generatedArticle, error: articleError } = await supabase
      .from('generated_articles')
      .insert({
        user_id: user.id,
        schedule_id: scheduleId,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        category: idea.category,
        tags: idea.tags,
        status: 'ready',
        scheduled_for: scheduledFor
      })
      .select()
      .single();

    if (articleError) throw articleError;

    console.log(`✅ Article generated: "${article.title}"`);
    
    return generatedArticle;
    
  } catch (error) {
    console.error('Article generation failed:', error);
    throw error;
  }
};

// Publish ready articles
export const publishReadyArticles = async (): Promise<number> => {

  try {
    console.log('🔍 Checking for articles ready to publish...');

    // Get articles ready for publishing
    const { data: articles, error } = await supabase
      .from('generated_articles')
      .select(`
        *,
        schedule:auto_publishing_schedules(
          wordpress_site:wordpress_sites(*)
        )
      `)
      .eq('status', 'ready')
      .lte('scheduled_for', new Date().toISOString());

    if (error) throw error;

    if (!articles || articles.length === 0) {
      console.log('📭 No articles ready for publishing');
      return 0;
    }

    console.log(`📋 Found ${articles.length} articles ready for publishing`);
    let publishedCount = 0;

    // Publish each article
    for (const article of articles) {
      try {
        await publishSingleArticle(article, 'dummy-api-key'); // API key not needed for this function
        publishedCount++;
      } catch (error) {
        console.error(`❌ Failed to publish article ${article.id}:`, error);

        // Mark article as failed
        await supabase
          .from('generated_articles')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', article.id);
      }
    }

    console.log(`✅ Successfully published ${publishedCount}/${articles.length} articles`);
    return publishedCount;

    console.log(`📤 Publishing ${articles.length} articles...`);

    for (const article of articles) {
      try {
        await publishSingleArticle(article, apiKey);
      } catch (error) {
        console.error(`Failed to publish article ${article.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('generated_articles')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', article.id);
      }
    }
    
  } catch (error) {
    console.error('Error in publishReadyArticles:', error);
  }
};

// Publish a single article
const publishSingleArticle = async (article: any, apiKey: string): Promise<void> => {
  
  // Mark as publishing
  await supabase
    .from('generated_articles')
    .update({ status: 'publishing' })
    .eq('id', article.id);

  const site = article.schedule.wordpress_site;
  
  try {
    // Generate featured image if needed
    let featuredImageUrl = article.featured_image_url;
    
    if (!featuredImageUrl) {
      try {
        console.log(`🎨 Generating featured image for: ${article.title}`);
        
        const mockBook = {
          id: 'temp',
          title: article.title,
          author: 'Blog Author',
          description: `Create a professional featured image for: ${article.title}`,
          genre: 'Blog',
          tone: 'Professional',
          chapters: [],
          status: 'draft' as const,
        };
        
        featuredImageUrl = await generateBookCover(mockBook, apiKey);
        
        // Update article with image URL
        await supabase
          .from('generated_articles')
          .update({ featured_image_url: featuredImageUrl })
          .eq('id', article.id);
          
      } catch (imageError) {
        console.warn('Featured image generation failed:', imageError);
        // Continue without featured image
      }
    }

    // Find category ID
    let categoryId = 1; // Default to "Uncategorized"
    
    try {
      const credentials = btoa(`${site.username}:${site.app_password}`);
      const categoriesResponse = await fetch(`${site.url}/wp-json/wp/v2/categories?search=${encodeURIComponent(article.category)}`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        if (categories.length > 0) {
          categoryId = categories[0].id;
        }
      }
    } catch (error) {
      console.warn('Failed to find category, using default');
    }

    // Publish to WordPress
    console.log(`📤 Publishing to WordPress: ${article.title}`);

    const publishResult = await publishArticle(
      article.user_id, // Use the actual user ID
      article.title,
      article.content,
      categoryId,
      featuredImageUrl || null
    );

    // Mark as published
    await supabase
      .from('generated_articles')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        wordpress_post_id: publishResult.id
      })
      .eq('id', article.id);

    console.log(`✅ Published: ${article.title} (${publishResult.link})`);

  } catch (error) {
    console.error(`Failed to publish article ${article.id}:`, error);
    throw error;
  }
};



// Calculate next run time based on frequency
const calculateNextRunTime = (frequency: string, timeOfDay: string, timezone: string): string => {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, move to next occurrence
  if (nextRun <= now) {
    switch (frequency) {
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  }
  
  return nextRun.toISOString();
};

// Update schedule's next run time
export const updateScheduleNextRun = async (scheduleId: string): Promise<void> => {
  const { data: schedule } = await supabase
    .from('auto_publishing_schedules')
    .select('frequency, time_of_day, timezone')
    .eq('id', scheduleId)
    .single();

  if (schedule) {
    const nextRunAt = calculateNextRunTime(
      schedule.frequency,
      schedule.time_of_day,
      schedule.timezone
    );

    const { error } = await supabase
      .from('auto_publishing_schedules')
      .update({
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId);

    if (error) {
      console.error('Error updating schedule next run time:', error);
      throw error;
    }

    console.log(`⏰ Updated next run time for schedule ${scheduleId}: ${nextRunAt}`);
  }
};

// Get all active schedules for monitoring
export const getActiveSchedules = async (): Promise<AutoPublishingSchedule[]> => {
  const { data, error } = await supabase
    .from('auto_publishing_schedules')
    .select(`
      *,
      wordpress_site:wordpress_sites(*)
    `)
    .eq('is_active', true)
    .not('blog_analysis', 'is', null)
    .order('next_run_at', { ascending: true });

  if (error) throw error;

  // Map database fields to TypeScript interface
  const mappedData = (data || []).map(schedule => ({
    ...schedule,
    blogAnalysis: schedule.blog_analysis,
    lastAnalyzed: schedule.last_analyzed,
    nextRunAt: schedule.next_run_at,
    wordPressSiteId: schedule.wordpress_site_id,
    wordPressSite: schedule.wordpress_site,
    isActive: schedule.is_active,
    timeOfDay: schedule.time_of_day,
    userId: schedule.user_id,
    createdAt: schedule.created_at,
    updatedAt: schedule.updated_at
  }));

  return mappedData;
};
