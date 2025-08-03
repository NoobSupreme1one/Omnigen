import React, { useState, useEffect } from 'react';
import { X, Plus, Globe, Settings, Rss, FileText } from 'lucide-react';
import { getUserWordPressSites } from '../services/wordpressService';
import { WordPressSite } from '../types';
import PubHubLogo from './PubHubLogo';

interface BlogSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectBlog: (blogId: string) => void;
  selectedBlogId: string | null;
}

const BlogSidebar: React.FC<BlogSidebarProps> = ({
  isOpen,
  onToggle,
  onSelectBlog,
  selectedBlogId
}) => {
  const [blogs, setBlogs] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const userBlogs = await getUserWordPressSites();
      setBlogs(userBlogs);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
        w-80 bg-white border-r border-gray-200 shadow-lg lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <PubHubLogo size="md" />
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Rss className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">My Blogs</h2>
          </div>
        </div>

        {/* Add New Blog Button */}
        <div className="p-4 border-b border-gray-200">
          <button className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Connect New Blog</span>
          </button>
        </div>

        {/* Blogs List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-4 text-center">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No blogs connected yet</p>
              <p className="text-gray-400 text-xs mt-1">Connect your first WordPress blog to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {blogs.map((blog) => (
                <button
                  key={blog.id}
                  onClick={() => onSelectBlog(blog.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 mb-2 ${
                    selectedBlogId === blog.id
                      ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{blog.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{blog.url}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          Connected
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogSidebar;
