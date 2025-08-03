import React, { useState, useEffect } from 'react';
import {
  AutoPublishingSchedule,
  GeneratedArticle,
  createAutoPublishingSchedule,
  getUserAutoPublishingSchedules,
  analyzeBlogForSchedule,
  generateNextArticle
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
  Calendar
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
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, sitesData] = await Promise.all([
        getUserAutoPublishingSchedules(),
        getUserWordPressSites()
      ]);
      
      setSchedules(schedulesData);
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
      const schedule = await createAutoPublishingSchedule(
        selectedSiteId,
        frequency,
        timeOfDay,
        timezone
      );
      
      setShowCreateModal(false);
      setSelectedSiteId('');
      setDetectedNiche(null);
      loadData();

      // Notify automation controller about new schedule
      await automationController.onScheduleCreated();

      // Automatically analyze the blog
      setTimeout(() => {
        handleAnalyzeBlog(schedule.id);
      }, 1000);
      
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
      await analyzeBlogForSchedule(scheduleId, apiKeys.gemini);
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
      await generateNextArticle(scheduleId, apiKeys.gemini);
      alert('Article generated successfully! It will be published at the scheduled time.');
      loadData();
    } catch (error) {
      console.error('Article generation failed:', error);
      alert('Article generation failed. Please try again.');
    } finally {
      setGenerating(null);
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

      {/* No sites warning */}
      {sites.length === 0 && (
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
    </div>
  );
};

export default AutoPublishing;
