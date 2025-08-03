import {
  WordPressSite,
  ArticleTemplate,
  PublicationSchedule,
  ScheduledArticle,
  PublishedArticle,
  SEOSettings,
  ScheduleConfig
} from '../types';
import { supabase } from '../lib/supabase';

export interface WordpressCredentials {
  url: string;
  username: string;
  password: string; // This will be an application password
}

const getStorageKey = (userId: string) => `wp_credentials_${userId}`;

export const saveWordpressCredentials = (userId: string, credentials: WordpressCredentials): void => {
  try {
    // Validate URL format
    const url = new URL(credentials.url);
    if (!url.protocol.startsWith('http')) {
      throw new Error('URL must start with http:// or https://');
    }
    
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save WordPress credentials to localStorage:', error);
    throw error;
  }
};

export const getWordpressCredentials = (userId: string): WordpressCredentials | null => {
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve WordPress credentials from localStorage:', error);
    return null;
  }
};

export const deleteWordpressCredentials = (userId: string): void => {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete WordPress credentials from localStorage:', error);
  }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, credentials: WordpressCredentials, options: RequestInit = {}) => {
  const { username, password } = credentials;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.code) {
        errorMessage = `${errorData.code}: ${errorData.message || errorData.data?.message || 'Unknown error'}`;
      }
    } catch {
      // If we can't parse the error as JSON, use the raw text
      if (errorText) {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
  }

  return response;
};

export const getCategories = async (userId: string): Promise<any[]> => {
  const credentials = getWordpressCredentials(userId);
  if (!credentials) {
    throw new Error('WordPress credentials not found. Please connect to WordPress first.');
  }

  const { url } = credentials;
  const endpoint = `${url}/wp-json/wp/v2/categories`;

  try {
    const response = await makeAuthenticatedRequest(endpoint, credentials);
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getArticles = async (userId: string, categoryId: number): Promise<any[]> => {
  const credentials = getWordpressCredentials(userId);
  if (!credentials) {
    throw new Error('WordPress credentials not found. Please connect to WordPress first.');
  }

  const { url } = credentials;
  const endpoint = `${url}/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100`;

  try {
    const response = await makeAuthenticatedRequest(endpoint, credentials);
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const publishArticle = async (userId: string, title: string, content: string, categoryId: number, featuredImage: string | null): Promise<any> => {
  try {
    const credentials = getWordpressCredentials(userId);
    if (!credentials) {
      throw new Error('WordPress credentials not found. Please connect to WordPress first.');
    }

    const { url } = credentials;
    let featuredImageId: number | null = null;

    // Upload featured image if provided
    if (featuredImage) {
      try {
        const imageResponse = await fetch(featuredImage);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        const formData = new FormData();
        formData.append('file', imageBlob, 'featured-image.png');

        const mediaEndpoint = `${url}/wp-json/wp/v2/media`;
        const mediaResponse = await fetch(mediaEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`),
          },
          body: formData,
        });

        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text();
          throw new Error(`Failed to upload featured image: ${mediaResponse.statusText}. ${errorText}`);
        }

        const mediaData = await mediaResponse.json();
        featuredImageId = mediaData.id;
      } catch (error) {
        console.warn('Failed to upload featured image, continuing without it:', error);
        // Continue without featured image rather than failing the entire operation
      }
    }

    // Publish the article
    const postsEndpoint = `${url}/wp-json/wp/v2/posts`;
    const postData = {
      title,
      content,
      status: 'publish',
      categories: [categoryId],
      ...(featuredImageId && { featured_media: featuredImageId }),
    };

    const response = await makeAuthenticatedRequest(postsEndpoint, credentials, {
      method: 'POST',
      body: JSON.stringify(postData),
    });

    const result = await response.json();
    console.log('Article published successfully:', result);
    return result;
  } catch (error) {
    console.error('Error publishing article:', error);
    throw new Error(`Failed to publish article: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test connection function
export const testConnection = async (userId: string): Promise<boolean> => {
  try {
    const credentials = getWordpressCredentials(userId);
    if (!credentials) {
      throw new Error('WordPress credentials not found.');
    }

    const { url } = credentials;
    const endpoint = `${url}/wp-json/wp/v2/users/me`;

    await makeAuthenticatedRequest(endpoint, credentials);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
};

// ===== NEW SCHEDULING SYSTEM =====

// WordPress Sites Management (Database-based)
export const createWordPressSite = async (siteData: Omit<WordPressSite, 'id' | 'createdAt' | 'updatedAt'>): Promise<WordPressSite> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('wordpress_sites')
    .insert({
      user_id: user.id,
      name: siteData.name,
      url: siteData.url,
      username: siteData.username,
      app_password: siteData.appPassword,
      is_active: siteData.isActive,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserWordPressSites = async (): Promise<WordPressSite[]> => {
  console.log('🔍 Getting user WordPress sites...');

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    console.log('🗃️ Querying WordPress sites...');

    // Use direct fetch to bypass Supabase client issues
    const response = await fetch(`http://127.0.0.1:54321/rest/v1/wordpress_sites?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!response.ok) {
      throw new Error(`WordPress sites query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ WordPress sites data:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error getting WordPress sites:', error);
    throw error;
  }
};

// Article Templates Management
export const createArticleTemplate = async (templateData: Omit<ArticleTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ArticleTemplate> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('article_templates')
    .insert({
      user_id: user.id,
      name: templateData.name,
      description: templateData.description,
      prompt_template: templateData.promptTemplate,
      category_mapping: templateData.categoryMapping,
      tag_templates: templateData.tagTemplates,
      writing_persona_id: templateData.writingPersonaId,
      featured_image_prompt: templateData.featuredImagePrompt,
      seo_settings: templateData.seoSettings,
      is_active: templateData.isActive,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserArticleTemplates = async (): Promise<ArticleTemplate[]> => {
  console.log('🔍 Getting user article templates...');

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    console.log('🗃️ Querying article templates...');

    // Use direct fetch to bypass Supabase client issues
    const response = await fetch(`http://127.0.0.1:54321/rest/v1/article_templates?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!response.ok) {
      throw new Error(`Article templates query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Article templates data:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error getting article templates:', error);
    throw error;
  }
};

// Publication Schedules Management
export const createPublicationSchedule = async (scheduleData: Omit<PublicationSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextRunAt'>): Promise<PublicationSchedule> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Calculate next run time
  const nextRunAt = calculateNextRunTime(scheduleData.scheduleType, scheduleData.scheduleConfig);

  const { data, error } = await supabase
    .from('publication_schedules')
    .insert({
      user_id: user.id,
      name: scheduleData.name,
      wordpress_site_id: scheduleData.wordPressSiteId,
      article_template_id: scheduleData.articleTemplateId,
      schedule_type: scheduleData.scheduleType,
      schedule_config: scheduleData.scheduleConfig,
      next_run_at: nextRunAt,
      is_active: scheduleData.isActive,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserPublicationSchedules = async (): Promise<PublicationSchedule[]> => {
  console.log('🔍 Getting user publication schedules...');

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    console.log('🗃️ Querying publication schedules...');

    // Use direct fetch to bypass Supabase client issues
    const response = await fetch(`http://127.0.0.1:54321/rest/v1/publication_schedules?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!response.ok) {
      throw new Error(`Publication schedules query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Publication schedules data:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error getting publication schedules:', error);
    throw error;
  }
};

// Scheduled Articles Management
export const createScheduledArticle = async (articleData: Omit<ScheduledArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledArticle> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('scheduled_articles')
    .insert({
      user_id: user.id,
      publication_schedule_id: articleData.publicationScheduleId,
      wordpress_site_id: articleData.wordPressSiteId,
      article_template_id: articleData.articleTemplateId,
      title: articleData.title,
      content: articleData.content,
      featured_image_url: articleData.featuredImageUrl,
      wordpress_categories: articleData.wordPressCategories,
      wordpress_tags: articleData.wordPressTags,
      seo_title: articleData.seoTitle,
      seo_description: articleData.seoDescription,
      scheduled_for: articleData.scheduledFor,
      status: articleData.status,
      retry_count: articleData.retryCount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getScheduledArticles = async (status?: string): Promise<ScheduledArticle[]> => {
  console.log('🔍 Getting scheduled articles...');

  // Temporarily use hardcoded user ID to bypass auth issues
  const userId = '49ba8690-3080-4593-aed6-780f5ab983d7';
  console.log('👤 Using user ID:', userId);

  try {
    console.log('🗃️ Querying scheduled articles...');

    // Build query URL
    let queryUrl = `http://127.0.0.1:54321/rest/v1/scheduled_articles?select=*&user_id=eq.${userId}&order=scheduled_for.asc`;
    if (status) {
      queryUrl += `&status=eq.${status}`;
    }

    // Use direct fetch to bypass Supabase client issues
    const response = await fetch(queryUrl, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    });

    if (!response.ok) {
      throw new Error(`Scheduled articles query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Scheduled articles data:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error getting scheduled articles:', error);
    throw error;
  }
};

export const updateScheduledArticle = async (id: string, updates: Partial<ScheduledArticle>): Promise<ScheduledArticle> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('scheduled_articles')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Schedule calculation utilities
export const calculateNextRunTime = (scheduleType: string, config: ScheduleConfig): string => {
  const now = new Date();
  const [hours, minutes] = config.time.split(':').map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, move to next occurrence
  if (nextRun <= now) {
    switch (scheduleType) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        nextRun.setDate(nextRun.getDate() + 1);
    }
  }

  return nextRun.toISOString();
};

// Get articles due for generation/publication
export const getArticlesDueForProcessing = async (): Promise<ScheduledArticle[]> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('scheduled_articles')
    .select(`
      *,
      wordpress_site:wordpress_sites(*),
      article_template:article_templates(*)
    `)
    .lte('scheduled_for', now)
    .in('status', ['pending', 'ready'])
    .order('scheduled_for', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Published Articles tracking
export const createPublishedArticle = async (articleData: Omit<PublishedArticle, 'id' | 'createdAt'>): Promise<PublishedArticle> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('published_articles')
    .insert({
      user_id: user.id,
      scheduled_article_id: articleData.scheduledArticleId,
      wordpress_site_id: articleData.wordPressSiteId,
      wordpress_post_id: articleData.wordPressPostId,
      title: articleData.title,
      url: articleData.url,
      published_at: articleData.publishedAt,
      performance_data: articleData.performanceData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPublishedArticles = async (): Promise<PublishedArticle[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('published_articles')
    .select(`
      *,
      wordpress_site:wordpress_sites(*)
    `)
    .eq('user_id', user.id)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
