import { 
  PublicationSchedule, 
  ScheduledArticle, 
  ArticleTemplate,
  WordPressSite 
} from '../types';
import { 
  getArticlesDueForProcessing,
  updateScheduledArticle,
  createPublishedArticle,
  calculateNextRunTime,
  getUserPublicationSchedules
} from './wordpressService';
import { 
  generateArticleFromTemplate,
  generateFeaturedImage,
  generateSEOTags 
} from './articleGenerationService';
import { publishArticle } from './wordpressService';
// import { supabase } from '../lib/supabase'; // Disabled - Supabase removed

// Main scheduling processor - this would run as a background job
export class ArticleScheduler {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // Start the scheduler (runs every minute)
  start() {
    if (this.intervalId) {
      console.log('Scheduler already running');
      return;
    }
    
    console.log('Starting article scheduler...');
    this.intervalId = setInterval(() => {
      this.processScheduledArticles();
    }, 60000); // Check every minute
    
    // Run immediately on start
    this.processScheduledArticles();
  }
  
  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Article scheduler stopped');
    }
  }
  
  // Process all scheduled articles that are due
  async processScheduledArticles() {
    if (this.isProcessing) {
      console.log('Already processing articles, skipping...');
      return;
    }
    
    this.isProcessing = true;
    
    try {
      console.log('Checking for articles due for processing...');
      
      // Get articles that need processing
      const dueArticles = await getArticlesDueForProcessing();
      
      if (dueArticles.length === 0) {
        console.log('No articles due for processing');
        return;
      }
      
      console.log(`Found ${dueArticles.length} articles to process`);
      
      // Process each article
      for (const article of dueArticles) {
        try {
          await this.processArticle(article);
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
          
          // Update article with error status
          await updateScheduledArticle(article.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: article.retryCount + 1
          });
        }
      }
      
      // Update recurring schedules
      await this.updateRecurringSchedules();
      
    } catch (error) {
      console.error('Error in article scheduler:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Process a single article
  private async processArticle(article: ScheduledArticle) {
    console.log(`Processing article: ${article.id}`);
    
    // Skip if already processing or failed too many times
    if (article.status === 'generating' || article.retryCount >= 3) {
      return;
    }
    
    // Mark as generating
    await updateScheduledArticle(article.id, {
      status: 'generating'
    });
    
    try {
      let title = article.title;
      let content = article.content;
      let featuredImageUrl = article.featuredImageUrl;
      let seoTitle = article.seoTitle;
      let seoDescription = article.seoDescription;
      
      // Generate content if not already generated
      if (!title || !content) {
        console.log('Generating article content...');
        
        // Get user's API key (this would need to be stored securely)
        const apiKey = await this.getUserApiKey(article.wordPressSiteId);
        if (!apiKey) {
          throw new Error('No API key found for content generation');
        }
        
        const generated = await generateArticleFromTemplate(
          article.articleTemplate!,
          apiKey
        );
        
        title = generated.title;
        content = generated.content;
        seoTitle = generated.seoTitle;
        seoDescription = generated.seoDescription;
        
        // Generate featured image if template specifies it
        if (article.articleTemplate!.featuredImagePrompt && !featuredImageUrl) {
          console.log('Generating featured image...');
          try {
            featuredImageUrl = await generateFeaturedImage(
              article.articleTemplate!,
              title,
              apiKey
            );
          } catch (error) {
            console.warn('Failed to generate featured image:', error);
            // Continue without featured image
          }
        }
        
        // Generate SEO tags if not specified
        if (!article.wordPressTags.length) {
          console.log('Generating SEO tags...');
          try {
            const seoData = await generateSEOTags(title, content, apiKey);
            article.wordPressTags = seoData.tags;
            if (!article.wordPressCategories.length) {
              article.wordPressCategories = seoData.categories;
            }
          } catch (error) {
            console.warn('Failed to generate SEO tags:', error);
          }
        }
        
        // Update article with generated content
        await updateScheduledArticle(article.id, {
          title,
          content,
          featuredImageUrl,
          seoTitle,
          seoDescription,
          wordPressTags: article.wordPressTags,
          wordPressCategories: article.wordPressCategories,
          status: 'ready'
        });
      }
      
      // Publish to WordPress
      console.log('Publishing to WordPress...');
      
      // Get WordPress credentials
      const wpSite = article.wordPressSite!;
      const credentials = {
        url: wpSite.url,
        username: wpSite.username,
        password: wpSite.appPassword
      };
      
      // Find category ID (assuming first category)
      const categoryName = article.wordPressCategories[0] || 'Uncategorized';
      const categoryId = await this.getCategoryId(credentials, categoryName);
      
      // Publish article
      const publishResult = await publishArticle(
        'system', // This would need to be the user ID
        title!,
        content!,
        categoryId,
        featuredImageUrl || null
      );
      
      // Mark as published and create published article record
      await updateScheduledArticle(article.id, {
        status: 'published'
      });
      
      await createPublishedArticle({
        scheduledArticleId: article.id,
        wordPressSiteId: article.wordPressSiteId,
        wordPressPostId: publishResult.id,
        title: title!,
        url: publishResult.link,
        publishedAt: new Date().toISOString(),
        performanceData: {}
      });
      
      console.log(`Article published successfully: ${publishResult.link}`);
      
    } catch (error) {
      console.error(`Failed to process article ${article.id}:`, error);
      throw error;
    }
  }
  
  // Update recurring schedules to create next articles
  private async updateRecurringSchedules() {
    try {
      const schedules = await getUserPublicationSchedules();
      const activeSchedules = schedules.filter(s => s.isActive);
      
      for (const schedule of activeSchedules) {
        // Check if it's time to create the next article
        const now = new Date();
        const nextRun = new Date(schedule.nextRunAt || 0);
        
        if (nextRun <= now) {
          console.log(`Creating next article for schedule: ${schedule.name}`);
          
          // Calculate next run time
          const newNextRun = calculateNextRunTime(schedule.scheduleType, schedule.scheduleConfig);
          
          // Create new scheduled article
          await this.createNextScheduledArticle(schedule, newNextRun);
          
          // Update schedule's next run time
          await supabase
            .from('publication_schedules')
            .update({ next_run_at: newNextRun })
            .eq('id', schedule.id);
        }
      }
    } catch (error) {
      console.error('Error updating recurring schedules:', error);
    }
  }
  
  // Create next scheduled article for recurring schedule
  private async createNextScheduledArticle(schedule: PublicationSchedule, scheduledFor: string) {
    const { data, error } = await supabase
      .from('scheduled_articles')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        publication_schedule_id: schedule.id,
        wordpress_site_id: schedule.wordPressSiteId,
        article_template_id: schedule.articleTemplateId,
        scheduled_for: scheduledFor,
        status: 'pending',
        wordpress_categories: [],
        wordpress_tags: [],
        retry_count: 0
      });
    
    if (error) {
      console.error('Error creating next scheduled article:', error);
      throw error;
    }
  }
  
  // Helper to get user's API key (this would need proper implementation)
  private async getUserApiKey(wordPressSiteId: string): Promise<string | null> {
    // This would need to be implemented to securely retrieve user's API key
    // For now, return null - in production, this would get from secure storage
    return process.env.VITE_GEMINI_API_KEY || null;
  }
  
  // Helper to get WordPress category ID
  private async getCategoryId(credentials: any, categoryName: string): Promise<number> {
    // This would use the existing getCategories function
    // For now, return 1 (default category)
    return 1;
  }
}

// Singleton instance
export const articleScheduler = new ArticleScheduler();

// Manual trigger for testing
export const triggerScheduledGeneration = async (): Promise<void> => {
  await articleScheduler.processScheduledArticles();
};

// Create a one-time scheduled article
export const scheduleOneTimeArticle = async (
  wordPressSiteId: string,
  articleTemplateId: string,
  scheduledFor: Date,
  customVariables?: Record<string, string>
): Promise<ScheduledArticle> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('scheduled_articles')
    .insert({
      user_id: user.id,
      wordpress_site_id: wordPressSiteId,
      article_template_id: articleTemplateId,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
      wordpress_categories: [],
      wordpress_tags: [],
      retry_count: 0
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
