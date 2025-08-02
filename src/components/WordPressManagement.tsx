import React, { useState, useEffect } from 'react';
import { 
  WordPressSite, 
  ArticleTemplate, 
  PublicationSchedule, 
  ScheduledArticle,
  WritingPersona 
} from '../types';
import {
  createWordPressSite,
  getUserWordPressSites,
  createArticleTemplate,
  getUserArticleTemplates,
  createPublicationSchedule,
  getUserPublicationSchedules,
  getScheduledArticles
} from '../services/wordpressService';
import { getUserPersonas } from '../services/personaService';
import { 
  Plus, 
  Globe, 
  FileText, 
  Calendar, 
  Clock,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

interface WordPressManagementProps {
  apiKeys: {
    gemini?: string;
    openai?: string;
  };
}

const WordPressManagement: React.FC<WordPressManagementProps> = ({ apiKeys }) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'templates' | 'schedules' | 'articles'>('sites');
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [templates, setTemplates] = useState<ArticleTemplate[]>([]);
  const [schedules, setSchedules] = useState<PublicationSchedule[]>([]);
  const [articles, setArticles] = useState<ScheduledArticle[]>([]);
  const [personas, setPersonas] = useState<WritingPersona[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Forms
  const [siteForm, setSiteForm] = useState({
    name: '',
    url: '',
    username: '',
    appPassword: '',
    isActive: true
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    promptTemplate: '',
    writingPersonaId: '',
    featuredImagePrompt: '',
    categoryMapping: {},
    tagTemplates: [] as string[],
    seoSettings: {},
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sitesData, templatesData, schedulesData, articlesData, personasData] = await Promise.all([
        getUserWordPressSites(),
        getUserArticleTemplates(),
        getUserPublicationSchedules(),
        getScheduledArticles(),
        getUserPersonas()
      ]);
      
      setSites(sitesData);
      setTemplates(templatesData);
      setSchedules(schedulesData);
      setArticles(articlesData);
      setPersonas(personasData);
    } catch (error) {
      console.error('Error loading WordPress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async () => {
    try {
      await createWordPressSite(siteForm);
      setSiteForm({ name: '', url: '', username: '', appPassword: '', isActive: true });
      setShowSiteModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating WordPress site:', error);
      alert('Failed to create WordPress site. Please check your credentials.');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await createArticleTemplate({
        ...templateForm,
        categoryMapping: {},
        seoSettings: {}
      });
      setTemplateForm({
        name: '',
        description: '',
        promptTemplate: '',
        writingPersonaId: '',
        featuredImagePrompt: '',
        categoryMapping: {},
        tagTemplates: [],
        seoSettings: {},
        isActive: true
      });
      setShowTemplateModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating article template:', error);
      alert('Failed to create article template.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading WordPress settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">WordPress Publishing</h2>
          <p className="text-gray-600">Manage sites, templates, and automated publishing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'sites', label: 'WordPress Sites', icon: Globe },
            { id: 'templates', label: 'Article Templates', icon: FileText },
            { id: 'schedules', label: 'Publication Schedules', icon: Calendar },
            { id: 'articles', label: 'Scheduled Articles', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* WordPress Sites Tab */}
      {activeTab === 'sites' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">WordPress Sites</h3>
            <button
              onClick={() => setShowSiteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add Site
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => (
              <div key={site.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{site.name}</h4>
                    <p className="text-sm text-gray-500">{site.url}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${site.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>User: {site.username}</span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sites.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No WordPress sites</h3>
              <p className="text-gray-500 mb-4">Add your first WordPress site to start publishing</p>
              <button
                onClick={() => setShowSiteModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Your First Site
              </button>
            </div>
          )}
        </div>
      )}

      {/* Article Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Article Templates</h3>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                
                {template.writingPersona && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Persona: {template.writingPersona.name}</span>
                  </div>
                )}
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {template.promptTemplate.substring(0, 100)}...
                </p>
                
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No article templates</h3>
              <p className="text-gray-500 mb-4">Create templates to automate article generation</p>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Your First Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* Publication Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Publication Schedules</h3>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Create Schedule
            </button>
          </div>

          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>📅 {schedule.scheduleType}</span>
                      <span>🕒 {schedule.scheduleConfig.time}</span>
                      <span>📝 {schedule.articleTemplate?.name}</span>
                      <span>🌐 {schedule.wordPressSite?.name}</span>
                    </div>
                    
                    {schedule.nextRunAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Next: {new Date(schedule.nextRunAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {schedules.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No publication schedules</h3>
              <p className="text-gray-500 mb-4">Create schedules to automate article publishing</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Your First Schedule
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scheduled Articles Tab */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Scheduled Articles</h3>
          
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">
                        {article.title || 'Untitled Article'}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        article.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        article.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                        article.status === 'ready' ? 'bg-green-100 text-green-800' :
                        article.status === 'publishing' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {article.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>📅 {new Date(article.scheduledFor).toLocaleString()}</span>
                      <span>📝 {article.articleTemplate?.name}</span>
                      <span>🌐 {article.wordPressSite?.name}</span>
                    </div>
                    
                    {article.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {article.errorMessage}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {article.status === 'ready' && (
                      <button className="p-2 text-green-600 hover:text-green-700">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {article.status === 'failed' && (
                      <button className="p-2 text-red-600 hover:text-red-700">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {articles.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No scheduled articles</h3>
              <p className="text-gray-500">Articles will appear here when schedules are active</p>
            </div>
          )}
        </div>
      )}

      {/* Add Site Modal */}
      {showSiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add WordPress Site</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={siteForm.name}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="My WordPress Site"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WordPress URL</label>
                <input
                  type="url"
                  value={siteForm.url}
                  onChange={(e) => setSiteForm({ ...siteForm, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://yoursite.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={siteForm.username}
                  onChange={(e) => setSiteForm({ ...siteForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="admin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Password</label>
                <input
                  type="password"
                  value={siteForm.appPassword}
                  onChange={(e) => setSiteForm({ ...siteForm, appPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="xxxx xxxx xxxx xxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate this in WordPress Admin → Users → Profile → Application Passwords
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSiteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSite}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Article Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Daily Tech News"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Template for generating daily technology news articles"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Writing Persona</label>
                <select
                  value={templateForm.writingPersonaId}
                  onChange={(e) => setTemplateForm({ ...templateForm, writingPersonaId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No persona (default style)</option>
                  {personas.map((persona) => (
                    <option key={persona.id} value={persona.id}>{persona.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article Prompt Template</label>
                <textarea
                  value={templateForm.promptTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, promptTemplate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={6}
                  placeholder="Write a comprehensive article about {{current_day}}'s technology trends. Include recent developments, analysis, and future implications. The article should be informative and engaging for tech professionals."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables like {{current_date}}, {{current_month}}, {{current_year}}, {{current_day}}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image Prompt (Optional)</label>
                <textarea
                  value={templateForm.featuredImagePrompt}
                  onChange={(e) => setTemplateForm({ ...templateForm, featuredImagePrompt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Create a modern, professional image representing technology trends and innovation. Style: clean, futuristic, with tech elements like circuits, data visualization, or modern devices."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPressManagement;
