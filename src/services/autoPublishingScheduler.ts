import { supabase } from '../lib/supabase';
import {
  AutoPublishingSchedule,
  generateNextArticle,
  updateScheduleNextRun
} from './autoPublishingService';
import { publishArticle } from './wordpressService';
import { getUserApiKey, isAutoPublishingEnabled } from './userSettingsService';
import {
  automationLogger,
  logScheduleProcessed,
  logArticleGenerated,
  logArticlePublished,
  logError,
  logSchedulerStarted,
  logSchedulerStopped
} from './automationLogger';

interface SchedulerConfig {
  checkInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

interface ProcessingStats {
  schedulesChecked: number;
  articlesGenerated: number;
  articlesPublished: number;
  errors: number;
  lastRun: Date;
}

/**
 * Background scheduler for auto-publishing articles
 * Automatically generates and publishes articles based on schedules
 */
export class AutoPublishingScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: SchedulerConfig;
  private stats: ProcessingStats;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      checkInterval: 60000, // Check every minute
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      ...config
    };

    this.stats = {
      schedulesChecked: 0,
      articlesGenerated: 0,
      articlesPublished: 0,
      errors: 0,
      lastRun: new Date()
    };
  }

  /**
   * Start the background scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Auto-publishing scheduler is already running');
      return;
    }

    console.log('🚀 Starting auto-publishing scheduler...');
    console.log(`⏰ Check interval: ${this.config.checkInterval / 1000} seconds`);

    this.isRunning = true;

    // Log scheduler start
    await logSchedulerStarted();

    // Run immediately on start
    this.processSchedules();

    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.processSchedules();
    }, this.config.checkInterval);

    console.log('✅ Auto-publishing scheduler started successfully');
  }

  /**
   * Stop the background scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⏹️ Auto-publishing scheduler is not running');
      return;
    }

    console.log('🛑 Stopping auto-publishing scheduler...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    // Log scheduler stop
    await logSchedulerStopped();

    console.log('✅ Auto-publishing scheduler stopped');
  }

  /**
   * Get current scheduler status and stats
   */
  getStatus(): { isRunning: boolean; stats: ProcessingStats; config: SchedulerConfig } {
    return {
      isRunning: this.isRunning,
      stats: { ...this.stats },
      config: { ...this.config }
    };
  }

  /**
   * Main processing function - checks for due schedules and processes them
   */
  private async processSchedules(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('🔍 Checking for due auto-publishing schedules...');
      this.stats.lastRun = new Date();

      // Get all active schedules that are due for processing
      const dueSchedules = await this.getDueSchedules();
      this.stats.schedulesChecked += dueSchedules.length;

      if (dueSchedules.length === 0) {
        console.log('📭 No schedules due for processing');
        return;
      }

      console.log(`📋 Found ${dueSchedules.length} schedules due for processing`);

      // Process each due schedule
      for (const schedule of dueSchedules) {
        await this.processSchedule(schedule);
      }

      // Clean up old generated articles (optional)
      await this.cleanupOldArticles();

    } catch (error) {
      console.error('❌ Error in auto-publishing scheduler:', error);
      this.stats.errors++;
    }
  }

  /**
   * Get schedules that are due for processing
   */
  private async getDueSchedules(): Promise<AutoPublishingSchedule[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('auto_publishing_schedules')
      .select(`
        *,
        wordpress_site:wordpress_sites(*)
      `)
      .eq('is_active', true)
      .not('blog_analysis', 'is', null) // Only schedules with completed analysis
      .lte('next_run_at', now)
      .order('next_run_at', { ascending: true });

    if (error) {
      console.error('Error fetching due schedules:', error);
      throw error;
    }

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
  }

  /**
   * Process a single schedule
   */
  private async processSchedule(schedule: AutoPublishingSchedule): Promise<void> {
    console.log(`📝 Processing schedule: ${schedule.wordPressSite?.name} (${schedule.frequency})`);

    try {
      // Check if we have a Gemini API key (this would need to be handled properly in production)
      const apiKey = await this.getApiKey(schedule.userId);
      if (!apiKey) {
        console.warn(`⚠️ No Gemini API key found for user ${schedule.userId}, skipping schedule ${schedule.id}`);
        return;
      }

      // Generate article
      console.log(`🤖 Generating article for ${schedule.wordPressSite?.name}...`);
      const generatedArticle = await generateNextArticle(schedule.id, apiKey);
      this.stats.articlesGenerated++;
      
      console.log(`✅ Article generated: "${generatedArticle.title}"`);

      // Publish article immediately (or you could add a delay/queue here)
      await this.publishGeneratedArticle(generatedArticle, schedule);
      this.stats.articlesPublished++;

      // Update schedule's next run time
      await updateScheduleNextRun(schedule.id);
      
      console.log(`🎉 Successfully processed schedule for ${schedule.wordPressSite?.name}`);

    } catch (error) {
      console.error(`❌ Error processing schedule ${schedule.id}:`, error);
      this.stats.errors++;
      
      // You might want to implement retry logic here
      await this.handleScheduleError(schedule, error);
    }
  }

  /**
   * Publish a generated article to WordPress
   */
  private async publishGeneratedArticle(article: any, schedule: AutoPublishingSchedule): Promise<void> {
    console.log(`📤 Publishing article: "${article.title}"`);

    try {
      const site = schedule.wordPressSite;
      
      // Publish to WordPress
      const publishResult = await publishArticle(
        schedule.userId,
        article.title,
        article.content,
        article.category || 'Uncategorized',
        null // featured image - could be enhanced later
      );

      // Update article status in database
      await supabase
        .from('generated_articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          wordpress_post_id: publishResult.id
        })
        .eq('id', article.id);

      console.log(`✅ Published: "${article.title}" to ${site.name}`);
      console.log(`🔗 WordPress URL: ${publishResult.link}`);

    } catch (error) {
      console.error(`❌ Failed to publish article ${article.id}:`, error);
      
      // Update article with error status
      await supabase
        .from('generated_articles')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', article.id);
      
      throw error;
    }
  }

  /**
   * Get API key for a user
   */
  private async getApiKey(userId: string): Promise<string | null> {
    // Check if auto-publishing is enabled for this user
    const autoPublishingEnabled = await isAutoPublishingEnabled(userId);
    if (!autoPublishingEnabled) {
      console.log(`⏸️ Auto-publishing disabled for user ${userId}`);
      return null;
    }

    // Get the user's Gemini API key
    return await getUserApiKey(userId, 'gemini');
  }

  /**
   * Handle errors in schedule processing
   */
  private async handleScheduleError(schedule: AutoPublishingSchedule, error: any): Promise<void> {
    // Log the error
    console.error(`Schedule ${schedule.id} failed:`, error);
    
    // You could implement retry logic, notifications, etc. here
    // For now, we'll just log it and continue
  }

  /**
   * Clean up old generated articles (optional maintenance)
   */
  private async cleanupOldArticles(): Promise<void> {
    try {
      // Delete articles older than 30 days that failed or are no longer needed
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('generated_articles')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.warn('Warning: Failed to cleanup old articles:', error);
      }
    } catch (error) {
      console.warn('Warning: Error during cleanup:', error);
    }
  }
}

// Singleton instance
export const autoPublishingScheduler = new AutoPublishingScheduler();

// Convenience functions
export const startAutoPublishing = () => autoPublishingScheduler.start();
export const stopAutoPublishing = () => autoPublishingScheduler.stop();
export const getAutoPublishingStatus = () => autoPublishingScheduler.getStatus();
