
import React, { useState, useEffect } from 'react';
import { saveWordpressCredentials, getWordpressCredentials, deleteWordpressCredentials, getCategories, getArticles, publishArticle } from '../services/wordpressService';
import { analyzeContentAndGenerateTopics, generateArticle } from '../services/geminiService';
import { generateFeaturedImage } from '../services/coverService';
import ArticleEditor from './ArticleEditor';

interface WordpressSettingsProps {
  onConnect?: () => void;
}

const WordpressSettings: React.FC<WordpressSettingsProps> = ({ onConnect }) => {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('test-user'); // Hardcoded for now
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isConnected, setIsConnected] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const [editedArticle, setEditedArticle] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const creds = getWordpressCredentials(userId);
    if (creds) {
      setUrl(creds.url);
      setUsername(creds.username);
      setPassword(creds.password);
      setIsConnected(true);
    }
  }, [userId]);

  // Debug environment variables
  useEffect(() => {
    console.log('Environment variables check:');
    console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'Set' : 'Not set');
    console.log('Current apiKey state:', apiKey ? 'Set' : 'Not set');
    console.log('API Key length:', apiKey?.length || 0);
  }, [apiKey]);

  // Helper function to get API key with fallback
  const getApiKey = () => {
    return apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWordpressCredentials(userId, { url, username, password });
    setIsConnected(true);
    setError(null);
    // Call the onConnect callback if provided
    if (onConnect) {
      onConnect();
    }
  };

  const handleDelete = () => {
    deleteWordpressCredentials(userId);
    setUrl('');
    setUsername('');
    setPassword('');
    setIsConnected(false);
    setCategories([]);
    setArticles([]);
    setAnalysis(null);
    setSuggestedTopics([]);
    setGeneratedArticle(null);
    setEditedArticle(null);
    setFeaturedImage(null);
    setError(null);
  };

  const handleFetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getCategories(userId);
      setCategories(fetchedCategories);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchArticles = async () => {
    if (!selectedCategory) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedArticles = await getArticles(userId, selectedCategory);
      setArticles(fetchedArticles);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeContent = async () => {
    if (articles.length === 0) {
      setError('No articles to analyze. Please fetch articles first.');
      return;
    }
    
    const currentApiKey = getApiKey();
    if (!currentApiKey) {
      setError('Gemini API key is not configured. Please check your environment variables.');
      return;
    }
    
    console.log('Starting content analysis...');
    console.log('Articles count:', articles.length);
    console.log('API Key available:', !!currentApiKey);
    console.log('API Key length:', currentApiKey?.length || 0);
    
    setIsLoading(true);
    setError(null);
    try {
      const content = articles.map(a => a.content.rendered).join('\n\n');
      console.log('Content length:', content.length);
      console.log('Content preview:', content.substring(0, 200) + '...');
      
      console.log('Calling analyzeContentAndGenerateTopics...');
      const result = await analyzeContentAndGenerateTopics(content, currentApiKey);
      console.log('Analysis result:', result);
      
      setAnalysis(result.analysis);
      setSuggestedTopics(result.suggestedTopics);
      setError(null);
    } catch (err: any) {
      console.error('Error in handleAnalyzeContent:', err);
      setError(err.message || 'Failed to analyze content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateArticle = async (topic: any) => {
    if (!analysis) {
      setError('No analysis available. Please analyze content first.');
      return;
    }
    
    const currentApiKey = getApiKey();
    if (!currentApiKey) {
      setError('Gemini API key is not configured. Please check your environment variables.');
      return;
    }
    
    console.log('Starting article generation...');
    console.log('Topic:', topic);
    console.log('Analysis:', analysis);
    console.log('API Key available:', !!currentApiKey);
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('Calling generateArticle...');
      const article = await generateArticle(topic.title, topic.description, analysis, currentApiKey);
      console.log('Generated article length:', article.length);
      console.log('Article preview:', article.substring(0, 200) + '...');
      
      setGeneratedArticle(article);
      setEditedArticle(article);
      setError(null);
    } catch (err: any) {
      console.error('Error in handleGenerateArticle:', err);
      setError(err.message || 'Failed to generate article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFeaturedImage = async () => {
    if (!generatedArticle) {
      setError('No article available. Please generate an article first.');
      return;
    }
    
    const currentApiKey = getApiKey();
    if (!currentApiKey) {
      setError('Gemini API key is not configured. Please check your environment variables.');
      return;
    }
    
    console.log('Starting featured image generation...');
    console.log('Article length:', generatedArticle.length);
    console.log('API Key available:', !!currentApiKey);
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('Calling generateFeaturedImage...');
      const image = await generateFeaturedImage('Featured Image', generatedArticle, currentApiKey);
      console.log('Generated image URL length:', image.length);
      
      setFeaturedImage(image);
      setError(null);
    } catch (err: any) {
      console.error('Error in handleGenerateFeaturedImage:', err);
      setError(err.message || 'Failed to generate featured image');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!editedArticle || !selectedCategory) {
      setError('Please ensure you have an article and selected category.');
      return;
    }
    
    console.log('Starting article publication...');
    console.log('Article length:', editedArticle.length);
    console.log('Category ID:', selectedCategory);
    console.log('Featured image available:', !!featuredImage);
    
    setIsPublishing(true);
    setPublishSuccess(false);
    setError(null);
    try {
      console.log('Calling publishArticle...');
      const result = await publishArticle(userId, 'New Article', editedArticle, selectedCategory, featuredImage);
      console.log('Publication result:', result);
      
      setPublishSuccess(true);
    } catch (err: any) {
      console.error('Error in handlePublish:', err);
      setError(err.message || 'Failed to publish article');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">WordPress Configuration</h2>
        <p className="text-gray-600 text-center mb-8">Enter your WordPress credentials to connect your site.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 font-medium">Connected to WordPress</p>
              <p className="text-sm text-green-500 mt-1">{url}</p>
              <button
                onClick={handleDelete}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Disconnect
              </button>
            </div>

            {/* Category Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 1: Select Category</h3>
              <button
                onClick={handleFetchCategories}
                disabled={isLoading}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Loading...' : 'Fetch Categories'}
              </button>
              
              {categories.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a category:
                  </label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Article Fetching */}
            {selectedCategory && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2: Fetch Articles</h3>
                <button
                  onClick={handleFetchArticles}
                  disabled={isLoading}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Loading...' : 'Fetch Articles'}
                </button>
                
                {articles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Found {articles.length} articles in this category.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Content Analysis */}
            {articles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 3: Analyze Content</h3>
                
                {/* API Key Status */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>API Key Status:</strong> {getApiKey() ? 'Configured' : 'Not configured'}
                  </p>
                  {getApiKey() && (
                    <p className="text-xs text-gray-500 mt-1">
                      Key: {getApiKey().substring(0, 10)}...{getApiKey().substring(getApiKey().length - 4)}
                    </p>
                  )}
                </div>
                
                {/* API Key Test Button */}
                <button
                  onClick={async () => {
                    const currentApiKey = getApiKey();
                    console.log('Testing API key...');
                    console.log('API Key:', currentApiKey ? `${currentApiKey.substring(0, 10)}...` : 'Not set');
                    console.log('Environment variable:', import.meta.env.VITE_GEMINI_API_KEY ? 'Set' : 'Not set');
                    
                    if (!currentApiKey) {
                      setError('API key is not configured. Please check your environment variables.');
                      return;
                    }
                    
                    try {
                      console.log('Making API request...');
                      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contents: [{ parts: [{ text: 'Hello, this is a test.' }] }],
                          generationConfig: { maxOutputTokens: 50 }
                        })
                      });
                      
                      console.log('Test response status:', testResponse.status);
                      console.log('Test response headers:', Object.fromEntries(testResponse.headers.entries()));
                      
                      if (testResponse.ok) {
                        const testData = await testResponse.json();
                        console.log('Test response:', testData);
                        setError('✅ API key test successful! Gemini API is working.');
                      } else {
                        const errorText = await testResponse.text();
                        console.error('API key test failed:', errorText);
                        setError(`❌ API key test failed: ${testResponse.status} - ${errorText}`);
                      }
                    } catch (err: any) {
                      console.error('API key test error:', err);
                      setError(`❌ API key test error: ${err.message}`);
                    }
                  }}
                  className="bg-yellow-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-600 transition-all duration-200"
                >
                  Test API Key
                </button>
                
                <button
                  onClick={handleAnalyzeContent}
                  disabled={isLoading}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Content'}
                </button>
              </div>
            )}

            {/* Topic Selection */}
            {suggestedTopics.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 4: Select Topic</h3>
                <div className="grid gap-3">
                  {suggestedTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleGenerateArticle(topic)}
                      disabled={isLoading}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      <h4 className="font-medium text-gray-800">{topic.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Article Generation and Publishing */}
            {generatedArticle && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 5: Review and Publish</h3>
                
                {featuredImage && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Featured Image:</h4>
                    <img src={featuredImage} alt="Featured Image" className="max-w-md rounded-lg" />
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handleGenerateFeaturedImage}
                    disabled={isLoading}
                    className="bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? 'Generating...' : 'Generate Featured Image'}
                  </button>

                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Article Content:</h4>
                    <ArticleEditor
                      content={editedArticle || generatedArticle}
                      onContentChange={setEditedArticle}
                    />
                  </div>

                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || !editedArticle || !selectedCategory}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish to WordPress'}
                  </button>

                  {publishSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-600 font-medium">Article published successfully!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="wp-url" className="block text-sm font-medium text-gray-700">
                WordPress URL
              </label>
              <input
                type="url"
                id="wp-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="wp-username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="wp-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your-username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="wp-password" className="block text-sm font-medium text-gray-700">
                Application Password
              </label>
              <input
                type="password"
                id="wp-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                This is an application-specific password. See WordPress documentation for details.
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Connect to WordPress
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WordpressSettings;





