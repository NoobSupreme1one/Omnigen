import { supabase } from '../lib/supabase';
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

// Create auto-publishing schedule
export const createAutoPublishingSchedule = async (
  wordPressSiteId: string,
  frequency: string,
  timeOfDay: string,
  timezone: string = 'UTC'
): Promise<AutoPublishingSchedule> => {
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Calculate next run time
  const nextRunAt = calculateNextRunTime(frequency, timeOfDay, timezone);

  const { data, error } = await supabase
    .from('auto_publishing_schedules')
    .insert({
      user_id: user.id,
      wordpress_site_id: wordPressSiteId,
      frequency,
      time_of_day: timeOfDay,
      timezone,
      next_run_at: nextRunAt,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get user's auto-publishing schedules
export const getUserAutoPublishingSchedules = async (): Promise<AutoPublishingSchedule[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('auto_publishing_schedules')
    .select(`
      *,
      wordpress_site:wordpress_sites(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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

// Analyze blog and update schedule
export const analyzeBlogForSchedule = async (
  scheduleId: string,
  apiKey: string
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
      site.app_password,
      apiKey
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
  scheduleId: string,
  apiKey: string
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
    const ideas = await generateArticleIdeas(analysis, 1, apiKey);
    
    if (ideas.length === 0) {
      throw new Error('No article ideas generated');
    }

    const idea = ideas[0];
    
    // Generate the full article
    const article = await generateBlogStyleArticle(idea, analysis, apiKey);
    
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
