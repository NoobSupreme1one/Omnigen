import { supabase } from '../lib/supabase';

export interface AutomationLog {
  id: string;
  userId: string;
  scheduleId?: string;
  articleId?: string;
  action: 'schedule_processed' | 'article_generated' | 'article_published' | 'error' | 'scheduler_started' | 'scheduler_stopped';
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  createdAt: string;
}

/**
 * Logger for automation events
 */
export class AutomationLogger {
  private static instance: AutomationLogger;

  private constructor() {}

  static getInstance(): AutomationLogger {
    if (!AutomationLogger.instance) {
      AutomationLogger.instance = new AutomationLogger();
    }
    return AutomationLogger.instance;
  }

  /**
   * Log an automation event
   */
  async log(
    action: AutomationLog['action'],
    status: AutomationLog['status'],
    message: string,
    details?: {
      userId?: string;
      scheduleId?: string;
      articleId?: string;
      error?: any;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      // Console log for immediate feedback
      const emoji = this.getStatusEmoji(status);
      const timestamp = new Date().toISOString();
      console.log(`${emoji} [${timestamp}] ${action.toUpperCase()}: ${message}`);
      
      if (details?.error) {
        console.error('Error details:', details.error);
      }

      // Store in database for persistence (optional - you might want to create a logs table)
      // For now, we'll just use console logging
      
    } catch (error) {
      console.error('Failed to log automation event:', error);
    }
  }

  /**
   * Log successful schedule processing
   */
  async logScheduleProcessed(scheduleId: string, userId: string, siteName: string): Promise<void> {
    await this.log(
      'schedule_processed',
      'success',
      `Successfully processed schedule for ${siteName}`,
      { scheduleId, userId }
    );
  }

  /**
   * Log successful article generation
   */
  async logArticleGenerated(articleId: string, scheduleId: string, userId: string, title: string): Promise<void> {
    await this.log(
      'article_generated',
      'success',
      `Generated article: "${title}"`,
      { articleId, scheduleId, userId }
    );
  }

  /**
   * Log successful article publishing
   */
  async logArticlePublished(articleId: string, scheduleId: string, userId: string, title: string, wordpressUrl?: string): Promise<void> {
    await this.log(
      'article_published',
      'success',
      `Published article: "${title}"${wordpressUrl ? ` (${wordpressUrl})` : ''}`,
      { articleId, scheduleId, userId, metadata: { wordpressUrl } }
    );
  }

  /**
   * Log errors
   */
  async logError(
    action: AutomationLog['action'],
    message: string,
    error: any,
    context?: {
      userId?: string;
      scheduleId?: string;
      articleId?: string;
    }
  ): Promise<void> {
    await this.log(
      action,
      'error',
      message,
      { ...context, error }
    );
  }

  /**
   * Log scheduler lifecycle events
   */
  async logSchedulerStarted(): Promise<void> {
    await this.log(
      'scheduler_started',
      'info',
      'Auto-publishing scheduler started'
    );
  }

  async logSchedulerStopped(): Promise<void> {
    await this.log(
      'scheduler_stopped',
      'info',
      'Auto-publishing scheduler stopped'
    );
  }

  /**
   * Log warnings
   */
  async logWarning(message: string, details?: any): Promise<void> {
    await this.log(
      'error',
      'warning',
      message,
      details
    );
  }

  /**
   * Get emoji for status
   */
  private getStatusEmoji(status: AutomationLog['status']): string {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  }

  /**
   * Get recent logs (if you implement database storage)
   */
  async getRecentLogs(limit: number = 50): Promise<AutomationLog[]> {
    // This would query the database if you implement log storage
    // For now, return empty array
    return [];
  }

  /**
   * Clear old logs (maintenance function)
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    // This would clean up old logs from the database
    console.log(`Would clear logs older than ${daysToKeep} days`);
  }
}

// Export singleton instance
export const automationLogger = AutomationLogger.getInstance();

// Convenience functions
export const logScheduleProcessed = (scheduleId: string, userId: string, siteName: string) => 
  automationLogger.logScheduleProcessed(scheduleId, userId, siteName);

export const logArticleGenerated = (articleId: string, scheduleId: string, userId: string, title: string) => 
  automationLogger.logArticleGenerated(articleId, scheduleId, userId, title);

export const logArticlePublished = (articleId: string, scheduleId: string, userId: string, title: string, wordpressUrl?: string) => 
  automationLogger.logArticlePublished(articleId, scheduleId, userId, title, wordpressUrl);

export const logError = (action: AutomationLog['action'], message: string, error: any, context?: any) => 
  automationLogger.logError(action, message, error, context);

export const logSchedulerStarted = () => automationLogger.logSchedulerStarted();
export const logSchedulerStopped = () => automationLogger.logSchedulerStopped();
export const logWarning = (message: string, details?: any) => automationLogger.logWarning(message, details);
