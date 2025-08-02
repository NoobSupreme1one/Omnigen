export interface SubChapter {
  id: string;
  title: string;
  description: string;
  content?: string;
  status: 'pending' | 'generating' | 'completed';
}

export interface BookChapter {
  id: string;
  title: string;
  description: string;
  subChapters?: SubChapter[];
  status: 'pending' | 'generating' | 'completed';
  expanded?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  description: string;
  genre: string;
  subGenre?: string;
  tone: string;
  heatLevel?: string;
  perspective?: string;
  targetAudience?: string;
  coverUrl?: string;
  chapters: BookChapter[];
  status: 'draft' | 'generating' | 'completed';
  audiobook?: AudiobookData;
  writingPersonaId?: string;
  writingPersona?: WritingPersona;
}

export interface AudiobookData {
  id: string;
  selectedVoice?: string;
  audioChapters: AudioChapter[];
  totalDuration?: number;
  generatedAt: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export interface AudioChapter {
  id: string;
  chapterId: string;
  title: string;
  audioBlob?: Blob;
  audioUrl?: string;
  duration?: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  isRecommended?: boolean;
}

export interface WritingPersona {
  id: string;
  name: string;
  description: string;
  authorName?: string;
  sampleText?: string;
  analysisResults?: PersonaAnalysis;
  preferences: PersonaPreferences;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaAnalysis {
  writingStyle: {
    sentenceLength: 'short' | 'medium' | 'long' | 'varied';
    vocabulary: 'simple' | 'moderate' | 'complex' | 'academic';
    tone: string[];
    voiceCharacteristics: string[];
  };
  structuralElements: {
    paragraphLength: 'short' | 'medium' | 'long';
    dialogueStyle: string;
    descriptiveStyle: string;
    pacing: 'fast' | 'moderate' | 'slow' | 'varied';
  };
  genreSpecialty: string[];
  strengthsAndQuirks: string[];
  confidence: number;
}

export interface PersonaPreferences {
  preferredGenres: string[];
  avoidedTopics: string[];
  specialInstructions: string;
  targetAudience: string[];
}

// WordPress Publishing System Types
export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  appPassword: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleTemplate {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  categoryMapping: Record<string, string>;
  tagTemplates: string[];
  writingPersonaId?: string;
  writingPersona?: WritingPersona;
  featuredImagePrompt: string;
  seoSettings: SEOSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SEOSettings {
  titleTemplate?: string;
  descriptionTemplate?: string;
  focusKeywords?: string[];
  metaTags?: Record<string, string>;
}

export interface PublicationSchedule {
  id: string;
  name: string;
  wordPressSiteId: string;
  wordPressSite?: WordPressSite;
  articleTemplateId: string;
  articleTemplate?: ArticleTemplate;
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduleConfig: ScheduleConfig;
  nextRunAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConfig {
  days?: number[]; // 0-6 (Sunday-Saturday)
  time: string; // "HH:MM" format
  timezone: string;
  frequency?: number; // For custom schedules
}

export interface ScheduledArticle {
  id: string;
  publicationScheduleId?: string;
  wordPressSiteId: string;
  wordPressSite?: WordPressSite;
  articleTemplateId: string;
  articleTemplate?: ArticleTemplate;
  title?: string;
  content?: string;
  featuredImageUrl?: string;
  wordPressCategories: string[];
  wordPressTags: string[];
  seoTitle?: string;
  seoDescription?: string;
  scheduledFor: string;
  status: 'pending' | 'generating' | 'ready' | 'publishing' | 'failed';
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedArticle {
  id: string;
  scheduledArticleId?: string;
  wordPressSiteId: string;
  wordPressSite?: WordPressSite;
  wordPressPostId: number;
  title: string;
  url: string;
  publishedAt: string;
  performanceData: ArticlePerformanceData;
  createdAt: string;
}

export interface ArticlePerformanceData {
  views?: number;
  comments?: number;
  shares?: number;
  lastUpdated?: string;
}