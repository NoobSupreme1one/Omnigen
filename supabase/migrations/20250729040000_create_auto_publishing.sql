/*
  # Auto-Publishing System

  1. New Tables
    - `auto_publishing_schedules` - Simple schedules with blog analysis
    - `generated_articles` - Articles generated and published automatically

  2. Security
    - Enable RLS on all tables
    - User-specific access policies
*/

-- Auto Publishing Schedules (simplified)
CREATE TABLE IF NOT EXISTS auto_publishing_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wordpress_site_id uuid NOT NULL REFERENCES wordpress_sites(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  time_of_day text NOT NULL, -- "09:00" format
  timezone text DEFAULT 'UTC',
  is_active boolean DEFAULT true,
  blog_analysis jsonb, -- Store the blog analysis results
  last_analyzed timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Generated Articles (simplified)
CREATE TABLE IF NOT EXISTS generated_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES auto_publishing_schedules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text,
  tags text[] DEFAULT '{}',
  featured_image_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'publishing', 'published', 'failed')),
  scheduled_for timestamptz NOT NULL,
  published_at timestamptz,
  wordpress_post_id integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auto_publishing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own auto publishing schedules" ON auto_publishing_schedules
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own generated articles" ON generated_articles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_auto_publishing_schedules_user_id ON auto_publishing_schedules(user_id);
CREATE INDEX idx_auto_publishing_schedules_next_run ON auto_publishing_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_auto_publishing_schedules_wordpress_site ON auto_publishing_schedules(wordpress_site_id);

CREATE INDEX idx_generated_articles_user_id ON generated_articles(user_id);
CREATE INDEX idx_generated_articles_schedule_id ON generated_articles(schedule_id);
CREATE INDEX idx_generated_articles_status ON generated_articles(status);
CREATE INDEX idx_generated_articles_scheduled_for ON generated_articles(scheduled_for, status);

-- Update triggers
CREATE TRIGGER update_auto_publishing_schedules_updated_at
  BEFORE UPDATE ON auto_publishing_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_generated_articles_updated_at
  BEFORE UPDATE ON generated_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
