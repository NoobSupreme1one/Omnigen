import { supabase } from '../lib/supabase';

export interface UserSettings {
  id: string;
  userId: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  autoPublishingEnabled: boolean;
  notificationEmail?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user settings
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, create default settings
      return await createDefaultUserSettings();
    }
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    geminiApiKey: data.gemini_api_key,
    openaiApiKey: data.openai_api_key,
    autoPublishingEnabled: data.auto_publishing_enabled,
    notificationEmail: data.notification_email,
    timezone: data.timezone,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Update user settings
 */
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  
  if (settings.geminiApiKey !== undefined) updateData.gemini_api_key = settings.geminiApiKey;
  if (settings.openaiApiKey !== undefined) updateData.openai_api_key = settings.openaiApiKey;
  if (settings.autoPublishingEnabled !== undefined) updateData.auto_publishing_enabled = settings.autoPublishingEnabled;
  if (settings.notificationEmail !== undefined) updateData.notification_email = settings.notificationEmail;
  if (settings.timezone !== undefined) updateData.timezone = settings.timezone;

  const { data, error } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    geminiApiKey: data.gemini_api_key,
    openaiApiKey: data.openai_api_key,
    autoPublishingEnabled: data.auto_publishing_enabled,
    notificationEmail: data.notification_email,
    timezone: data.timezone,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Create default user settings
 */
export const createDefaultUserSettings = async (): Promise<UserSettings> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: user.id,
      auto_publishing_enabled: true,
      timezone: 'UTC'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    geminiApiKey: data.gemini_api_key,
    openaiApiKey: data.openai_api_key,
    autoPublishingEnabled: data.auto_publishing_enabled,
    notificationEmail: data.notification_email,
    timezone: data.timezone,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Get API key for a specific user (used by the scheduler)
 */
export const getUserApiKey = async (userId: string, keyType: 'gemini' | 'openai' = 'gemini'): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select(keyType === 'gemini' ? 'gemini_api_key' : 'openai_api_key')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return keyType === 'gemini' ? data.gemini_api_key : data.openai_api_key;
};

/**
 * Check if auto-publishing is enabled for a user
 */
export const isAutoPublishingEnabled = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('auto_publishing_enabled')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false; // Default to disabled if no settings found
  }

  return data.auto_publishing_enabled;
};
