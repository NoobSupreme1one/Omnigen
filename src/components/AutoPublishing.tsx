import React, { useState, useEffect } from 'react';
import {
  AutoPublishingSchedule,
  GeneratedArticle,
  createAutoPublishingSchedule,
  getUserAutoPublishingSchedules,
  analyzeBlogForSchedule,
  generateNextArticle,
  getGeneratedArticlesForSchedule,
  publishSampleArticle
} from '../services/autoPublishingService';
import { getUserWordPressSites } from '../services/wordpressService';
import { quickNicheDetection } from '../services/blogAnalysisService';
import { automationController, getAutomationStatus } from '../services/automationController';
import { WordPressSite } from '../types';
import {
  Plus,
  Play,
  Pause,
  Settings,
  BarChart3,
  Clock,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader,
  Brain,
  Calendar,
  FileText,
  Eye,
  Send,
  Image
} from 'lucide-react';

interface AutoPublishingProps {
  apiKeys: {
    gemini?: string;
    openai?: string;
  };
}

const AutoPublishing: React.FC<AutoPublishingProps> = ({ apiKeys }) => {
  const [schedules, setSchedules] = useState<AutoPublishingSchedule[]>([]);
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // New state for articles and publishing
  const [generatedArticles, setGeneratedArticles] = useState<{[scheduleId: string]: GeneratedArticle[]}>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<GeneratedArticle | null>(null);

  // Form state
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [timezone, setTimezone] = useState('UTC');
  const [detectedNiche, setDetectedNiche] = useState<{niche: string, confidence: number, topics: string[]} | null>(null);

  useEffect(() => {
    loadData();
    loadAutomationStatus();
  }, []);

  const loadAutomationStatus = async () => {
    try {
      const status = await getAutomationStatus();
      setAutomationStatus(status);
    } catch (error) {
      console.error('Error loading automation status:', error);
      // Don't set error for automation status - it's not critical
      setAutomationStatus(null);
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Starting to load auto-publishing data...');
      setLoading(true);
      setError(null);

      console.log('📊 Loading schedules and sites...');
      const [schedulesData, sitesData] = await Promise.all([
        getUserAutoPublishingSchedules(),
        getUserWordPressSites()
      ]);

      console.log('✅ Loaded schedules:', schedulesData.length, 'sites:', sitesData.length);
      setSchedules(schedulesData);
      setSites(sitesData);

      // Load generated articles for each schedule
      console.log('📝 Loading generated articles...');
      await loadGeneratedArticles(schedulesData);
      console.log('✅ Finished loading all data');
    } catch (error) {
      console.error('❌ Error loading data:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('User not authenticated') || error.message.includes('Auth session missing')) {
          setError('Please sign in to access auto-publishing features.');
        } else {
          setError(`Failed to load data: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred while loading data.');
      }

      // Set empty data on error
      setSchedules([]);
      setSites([]);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const loadGeneratedArticles = async (schedulesList: AutoPublishingSchedule[]) => {
    try {
      console.log('📝 Loading articles for', schedulesList.length, 'schedules');
      const articlesData: {[scheduleId: string]: GeneratedArticle[]} = {};

      for (const schedule of schedulesList) {
        try {
          console.log(`📄 Loading articles for schedule ${schedule.id}`);
          const articles = await getGeneratedArticlesForSchedule(schedule.id);
          console.log(`✅ Loaded ${articles.length} articles for schedule ${schedule.id}`);
          articlesData[schedule.id] = articles;
        } catch (error) {
          console.error(`❌ Error loading articles for schedule ${schedule.id}:`, error);
          articlesData[schedule.id] = [];
        }
      }

      console.log('📝 Setting generated articles data:', articlesData);
      setGeneratedArticles(articlesData);
    } catch (error) {
      console.error('❌ Error loading generated articles:', error);
    }
  };

  const handleSiteSelection = async (siteId: string) => {
    setSelectedSiteId(siteId);
    setDetectedNiche(null);
    
    if (siteId && apiKeys.gemini) {
      const site = sites.find(s => s.id === siteId);
      if (site) {
        try {
          console.log('🔍 Detecting niche for quick preview...');
          const niche = await quickNicheDetection(
            site.url,
            site.username,
            site.appPassword,
            apiKeys.gemini
          );
          setDetectedNiche(niche);
        } catch (error) {
          console.error('Niche detection failed:', error);
        }
      }
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedSiteId || !apiKeys.gemini) return;

    try {
      // Create schedule with sample article generation
      const result = await createAutoPublishingSchedule(
        selectedSiteId,
        frequency,
        timeOfDay,
        timezone,
        apiKeys.gemini
      );

      setShowCreateModal(false);
      setSelectedSiteId('');
      setDetectedNiche(null);

      // Reload data to show the new schedule and sample article
      await loadData();

      // Notify automation controller about new schedule
      await automationController.onScheduleCreated();

      // Show success message with sample article info
      if (result.sampleArticle) {
        alert(`Schedule created successfully! A sample article "${result.sampleArticle.title}" has been generated and is ready to publish.`);
      } else {
        alert('Schedule created successfully!');
      }

    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create auto-publishing schedule');
    }
  };

  const handleAnalyzeBlog = async (scheduleId: string) => {
    if (!apiKeys.gemini) {
      alert('Gemini API key required for blog analysis');
      return;
    }
    
    setAnalyzing(scheduleId);
    
    try {
      await analyzeBlogForSchedule(scheduleId);
      await loadData(); // Refresh to show analysis results
    } catch (error) {
      console.error('Blog analysis failed:', error);
      alert('Blog analysis failed. Please check your WordPress connection.');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleGenerateArticle = async (scheduleId: string) => {
    if (!apiKeys.gemini) {
      alert('Gemini API key required for article generation');
      return;
    }
    
    setGenerating(scheduleId);
    
    try {
      await generateNextArticle(scheduleId);
      alert('Article generated successfully! It will be published at the scheduled time.');
      loadData();
    } catch (error) {
      console.error('Article generation failed:', error);
      alert('Article generation failed. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const handleViewArticle = (article: GeneratedArticle) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handlePublishArticle = async (articleId: string) => {
    setPublishing(articleId);

    try {
      await publishSampleArticle(articleId);

      // Reload articles to update status
      await loadGeneratedArticles(schedules);

      alert('Article published successfully!');
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Failed to publish article');
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading auto-publishing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Auto-Publishing</h2>
          <p className="text-gray-600">Set up automatic content generation and publishing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={sites.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No sites warning */}
      {!error && sites.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">No WordPress sites connected</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Please connect a WordPress site first in the "WordPress Sites" tab.
          </p>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-white border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">
                    {schedule.wordPressSite?.name || 'WordPress Site'}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    schedule.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {schedule.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {schedule.frequency} at {schedule.timeOfDay}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {schedule.timezone}
                  </span>
                  {schedule.nextRunAt && (
                    <span className="text-indigo-600">
                      Next: {new Date(schedule.nextRunAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Blog Analysis Status */}
                {schedule.blogAnalysis ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Blog Analyzed</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p><strong>Niche:</strong> {schedule.blogAnalysis.niche}</p>
                      <p><strong>Topics:</strong> {schedule.blogAnalysis.topics.slice(0, 3).join(', ')}</p>
                      <p><strong>Style:</strong> {schedule.blogAnalysis.writingStyle?.tone} tone, {schedule.blogAnalysis.writingStyle?.complexity} level</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Blog analysis required</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Analyze the blog content to understand its niche and style before generating articles.
                    </p>
                  </div>
                )}

                {/* Generated Articles Section */}
                {generatedArticles[schedule.id] && generatedArticles[schedule.id].length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Generated Articles ({generatedArticles[schedule.id].length})</span>
                    </div>
                    <div className="space-y-2">
                      {generatedArticles[schedule.id].slice(0, 3).map((article) => (
                        <div key={article.id} className="flex items-center justify-between bg-white rounded p-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{article.title}</h4>
                              {article.featured_image_url && (
                                <Image className="w-3 h-3 text-green-600" title="Has featured image" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                article.status === 'published' ? 'bg-green-100 text-green-700' :
                                article.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                article.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {article.status}
                              </span>
                              <span>{new Date(article.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewArticle(article)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="View article"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            {article.status === 'ready' && (
                              <button
                                onClick={() => handlePublishArticle(article.id)}
                                disabled={publishing === article.id}
                                className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                                title="Publish article"
                              >
                                {publishing === article.id ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {generatedArticles[schedule.id].length > 3 && (
                        <p className="text-xs text-blue-600 text-center">
                          +{generatedArticles[schedule.id].length - 3} more articles
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!schedule.blogAnalysis && (
                  <button
                    onClick={() => handleAnalyzeBlog(schedule.id)}
                    disabled={analyzing === schedule.id || !apiKeys.gemini}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {analyzing === schedule.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                    {analyzing === schedule.id ? 'Analyzing...' : 'Analyze Blog'}
                  </button>
                )}

                {schedule.blogAnalysis && (
                  <button
                    onClick={() => handleGenerateArticle(schedule.id)}
                    disabled={generating === schedule.id || !apiKeys.gemini}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {generating === schedule.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {generating === schedule.id ? 'Generating...' : 'Generate Article'}
                  </button>
                )}

                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {schedules.length === 0 && sites.length > 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No auto-publishing schedules</h3>
          <p className="text-gray-500 mb-4">Create your first schedule to start automatic content generation</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Your First Schedule
          </button>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create Auto-Publishing Schedule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WordPress Site</label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {detectedNiche && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Detected Niche</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    <strong>{detectedNiche.niche}</strong> ({detectedNiche.confidence}% confidence)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Topics: {detectedNiche.topics.join(', ')}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publishing Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedSiteId('');
                  setDetectedNiche(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={!selectedSiteId}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Viewing Modal */}
      {showArticleModal && selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{selectedArticle.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedArticle.status === 'published' ? 'bg-green-100 text-green-700' :
                    selectedArticle.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                    selectedArticle.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedArticle.status}
                  </span>
                  <span>Category: {selectedArticle.category}</span>
                  <span>Created: {new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedArticle.status === 'ready' && (
                  <button
                    onClick={() => handlePublishArticle(selectedArticle.id)}
                    disabled={publishing === selectedArticle.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {publishing === selectedArticle.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {publishing === selectedArticle.id ? 'Publishing...' : 'Publish Now'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowArticleModal(false);
                    setSelectedArticle(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Featured Image */}
              {selectedArticle.featured_image_url && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Featured Image</h4>
                  <img
                    src={selectedArticle.featured_image_url}
                    alt={selectedArticle.title}
                    className="w-full max-w-md rounded-lg border"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Excerpt</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedArticle.excerpt}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                  <div
                    className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                </div>

                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoPublishing;
