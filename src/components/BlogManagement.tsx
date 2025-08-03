import React, { useState, useEffect } from 'react';
import { Settings, Rss, FileText, Globe, Plus, Calendar } from 'lucide-react';
import { getUserWordPressSites } from '../services/wordpressService';
import WordPressManagement from './WordPressManagement';
import AutoPublishing from './AutoPublishing';
import WordpressGenerator from './WordpressGenerator';
import { WordPressSite, WritingPersona } from '../types';

interface BlogManagementProps {
  selectedBlogId: string | null;
  blogView: 'overview' | 'settings' | 'autopublish' | 'articles';
  setBlogView: (view: 'overview' | 'settings' | 'autopublish' | 'articles') => void;
  apiKeys: any;
  selectedPersona: WritingPersona | null;
  setSelectedPersona: (persona: WritingPersona | null) => void;
}

const BlogManagement: React.FC<BlogManagementProps> = ({
  selectedBlogId,
  blogView,
  setBlogView,
  apiKeys,
  selectedPersona,
  setSelectedPersona
}) => {
  const [selectedBlog, setSelectedBlog] = useState<WordPressSite | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBlogId) {
      loadBlogDetails(selectedBlogId);
    }
  }, [selectedBlogId]);

  const loadBlogDetails = async (blogId: string) => {
    try {
      setLoading(true);
      const blogs = await getUserWordPressSites();
      const blog = blogs.find(b => b.id === blogId);
      setSelectedBlog(blog || null);
    } catch (error) {
      console.error('Failed to load blog details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBlogId) {
    return (
      <div className="text-center py-12">
        <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Blog Management</h2>
        <p className="text-gray-600 mb-6">Select a blog from the sidebar to manage its content and settings</p>
        <div className="flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm">
            <Plus className="w-5 h-5" />
            <span>Connect Your First Blog</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!selectedBlog) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Blog not found</div>
        <p className="text-gray-600">The selected blog could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Blog Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedBlog.name}</h1>
              <p className="text-gray-600">{selectedBlog.url}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-green-100 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setBlogView('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                blogView === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Rss className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setBlogView('articles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                blogView === 'articles'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Articles
              </div>
            </button>
            <button
              onClick={() => setBlogView('autopublish')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                blogView === 'autopublish'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Auto-Publishing
              </div>
            </button>
            <button
              onClick={() => setBlogView('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                blogView === 'settings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {blogView === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Blog Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Total Articles</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">--</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Scheduled</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">--</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Rss className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Published</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">--</div>
                </div>
              </div>
            </div>
          )}

          {blogView === 'articles' && (
            <WordpressGenerator 
              apiKeys={apiKeys} 
              persona={selectedPersona} 
            />
          )}

          {blogView === 'autopublish' && (
            <AutoPublishing
              apiKeys={apiKeys}
            />
          )}

          {blogView === 'settings' && (
            <WordPressManagement
              apiKeys={apiKeys}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
