/*
  # WordPress Publishing System

  1. New Tables
    - `wordpress_sites` - Store WordPress site configurations
    - `article_templates` - Reusable article templates
    - `scheduled_articles` - Articles scheduled for publication
    - `published_articles` - Track published articles
    - `publication_schedules` - Recurring schedule configurations

  2. Security
    - Enable RLS on all tables
    - User-specific access policies

  3. Functions
    - Article generation and scheduling functions
*/

-- WordPress Sites Configuration
CREATE TABLE IF NOT EXISTS wordpress_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  username text NOT NULL,
  app_password text NOT NULL, -- WordPress Application Password
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Article Templates
CREATE TABLE IF NOT EXISTS article_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  prompt_template text NOT NULL,
  category_mapping jsonb DEFAULT '{}', -- WordPress category mappings
  tag_templates text[] DEFAULT '{}',
  writing_persona_id uuid REFERENCES writing_personas(id) ON DELETE SET NULL,
  featured_image_prompt text DEFAULT '',
  seo_settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Publication Schedules
CREATE TABLE IF NOT EXISTS publication_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  wordpress_site_id uuid NOT NULL REFERENCES wordpress_sites(id) ON DELETE CASCADE,
  article_template_id uuid NOT NULL REFERENCES article_templates(id) ON DELETE CASCADE,
  schedule_type text NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  schedule_config jsonb NOT NULL, -- Cron-like config: {days: [1,3,5], time: "09:00", timezone: "UTC"}
  next_run_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scheduled Articles (pending generation/publication)
CREATE TABLE IF NOT EXISTS scheduled_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publication_schedule_id uuid REFERENCES publication_schedules(id) ON DELETE CASCADE,
  wordpress_site_id uuid NOT NULL REFERENCES wordpress_sites(id) ON DELETE CASCADE,
  article_template_id uuid NOT NULL REFERENCES article_templates(id) ON DELETE CASCADE,
  title text,
  content text,
  featured_image_url text,
  wordpress_categories text[] DEFAULT '{}',
  wordpress_tags text[] DEFAULT '{}',
  seo_title text,
  seo_description text,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'publishing', 'failed')),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Published Articles (tracking)
CREATE TABLE IF NOT EXISTS published_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_article_id uuid REFERENCES scheduled_articles(id) ON DELETE SET NULL,
  wordpress_site_id uuid NOT NULL REFERENCES wordpress_sites(id) ON DELETE CASCADE,
  wordpress_post_id integer NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  published_at timestamptz NOT NULL,
  performance_data jsonb DEFAULT '{}', -- Views, comments, etc.
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wordpress_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own WordPress sites" ON wordpress_sites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own article templates" ON article_templates
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own publication schedules" ON publication_schedules
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own scheduled articles" ON scheduled_articles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own published articles" ON published_articles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_wordpress_sites_user_id ON wordpress_sites(user_id);
CREATE INDEX idx_article_templates_user_id ON article_templates(user_id);
CREATE INDEX idx_publication_schedules_user_id ON publication_schedules(user_id);
CREATE INDEX idx_publication_schedules_next_run ON publication_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_scheduled_articles_user_id ON scheduled_articles(user_id);
CREATE INDEX idx_scheduled_articles_scheduled_for ON scheduled_articles(scheduled_for, status);
CREATE INDEX idx_published_articles_user_id ON published_articles(user_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wordpress_sites_updated_at
  BEFORE UPDATE ON wordpress_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_article_templates_updated_at
  BEFORE UPDATE ON article_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_publication_schedules_updated_at
  BEFORE UPDATE ON publication_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_scheduled_articles_updated_at
  BEFORE UPDATE ON scheduled_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
