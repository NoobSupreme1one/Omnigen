import { 
  autoPublishingScheduler, 
  startAutoPublishing, 
  stopAutoPublishing, 
  getAutoPublishingStatus 
} from './autoPublishingScheduler';
import { getActiveSchedules, publishReadyArticles } from './autoPublishingService';

/**
 * Main automation controller for the auto-publishing system
 * Manages the lifecycle of the background scheduler
 */
export class AutomationController {
  private static instance: AutomationController;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AutomationController {
    if (!AutomationController.instance) {
      AutomationController.instance = new AutomationController();
    }
    return AutomationController.instance;
  }

  /**
   * Initialize the automation system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 Automation controller already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing auto-publishing automation...');

      // Check if there are any active schedules
      const activeSchedules = await getActiveSchedules();
      console.log(`📊 Found ${activeSchedules.length} active auto-publishing schedules`);

      if (activeSchedules.length > 0) {
        // Start the background scheduler
        await autoPublishingScheduler.start();
        console.log('✅ Auto-publishing scheduler started');
      } else {
        console.log('📭 No active schedules found, scheduler will start when schedules are created');
      }

      // Publish any articles that are ready
      const publishedCount = await publishReadyArticles();
      if (publishedCount > 0) {
        console.log(`📤 Published ${publishedCount} ready articles on startup`);
      }

      this.isInitialized = true;
      console.log('🎉 Auto-publishing automation initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize automation controller:', error);
      throw error;
    }
  }

  /**
   * Start the automation system
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await autoPublishingScheduler.start();
    console.log('▶️ Auto-publishing automation started');
  }

  /**
   * Stop the automation system
   */
  async stop(): Promise<void> {
    await autoPublishingScheduler.stop();
    console.log('⏹️ Auto-publishing automation stopped');
  }

  /**
   * Restart the automation system
   */
  async restart(): Promise<void> {
    console.log('🔄 Restarting auto-publishing automation...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.start();
    console.log('✅ Auto-publishing automation restarted');
  }

  /**
   * Get current status of the automation system
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    activeSchedules: number;
    stats: any;
    config: any;
  }> {
    const schedulerStatus = getAutoPublishingStatus();
    const activeSchedules = await getActiveSchedules();

    return {
      isRunning: schedulerStatus.isRunning,
      activeSchedules: activeSchedules.length,
      stats: schedulerStatus.stats,
      config: schedulerStatus.config
    };
  }

  /**
   * Trigger manual processing (for testing)
   */
  async triggerManualProcessing(): Promise<void> {
    console.log('🔧 Triggering manual processing...');
    
    try {
      // This will trigger the scheduler to check for due schedules immediately
      await autoPublishingScheduler['processSchedules']();
      console.log('✅ Manual processing completed');
    } catch (error) {
      console.error('❌ Manual processing failed:', error);
      throw error;
    }
  }

  /**
   * Check if automation should be running based on active schedules
   */
  async shouldBeRunning(): Promise<boolean> {
    const activeSchedules = await getActiveSchedules();
    return activeSchedules.length > 0;
  }

  /**
   * Auto-start scheduler when new schedules are created
   */
  async onScheduleCreated(): Promise<void> {
    const status = getAutoPublishingStatus();
    if (!status.isRunning) {
      const shouldRun = await this.shouldBeRunning();
      if (shouldRun) {
        console.log('📅 New schedule created, starting automation...');
        await this.start();
      }
    }
  }

  /**
   * Auto-stop scheduler when all schedules are removed/deactivated
   */
  async onScheduleRemoved(): Promise<void> {
    const shouldRun = await this.shouldBeRunning();
    if (!shouldRun) {
      console.log('📭 No active schedules remaining, stopping automation...');
      await this.stop();
    }
  }
}

// Export singleton instance
export const automationController = AutomationController.getInstance();

// Convenience functions
export const initializeAutomation = () => automationController.initialize();
export const startAutomation = () => automationController.start();
export const stopAutomation = () => automationController.stop();
export const restartAutomation = () => automationController.restart();
export const getAutomationStatus = () => automationController.getStatus();
export const triggerManualProcessing = () => automationController.triggerManualProcessing();
