import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';

interface WordPressTroubleshooterProps {
  onClose: () => void;
}

const WordPressTroubleshooter: React.FC<WordPressTroubleshooterProps> = ({ onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testUsername, setTestUsername] = useState('');
  const [testPassword, setTestPassword] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testEndpoint = (endpoint: string) => {
    const fullUrl = `${testUrl}${endpoint}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">WordPress Connection Troubleshooter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Quick Test Section */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Quick Connection Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="url"
              placeholder="https://yoursite.com"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Username"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Application Password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => testEndpoint('/wp-json/wp/v2')}
              disabled={!testUrl}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Test REST API
            </button>
            <button
              onClick={() => testEndpoint('/wp-json/wp/v2/users/me')}
              disabled={!testUrl || !testUsername || !testPassword}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Test Auth
            </button>
          </div>
        </div>

        {/* Common Issues */}
        <div className="space-y-6">
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Issue #1: REST API Not Found (404 Error)</h3>
                <p className="text-red-700 text-sm mb-3">
                  The WordPress REST API is not accessible. This is usually due to permalink settings.
                </p>
                <div className="bg-white p-3 rounded border text-sm">
                  <p className="font-medium mb-2">Solution:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Go to your WordPress Admin Dashboard</li>
                    <li>Navigate to <strong>Settings → Permalinks</strong></li>
                    <li>Change from "Plain" to any other option (like "Post name")</li>
                    <li>Click "Save Changes"</li>
                    <li>Try connecting again</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">Issue #2: Authentication Failed (401 Error)</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Your username or application password is incorrect.
                </p>
                <div className="bg-white p-3 rounded border text-sm">
                  <p className="font-medium mb-2">Solution:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Go to WordPress Admin → <strong>Users → Profile</strong></li>
                    <li>Scroll down to "Application Passwords"</li>
                    <li>Enter a name like "BookGen" and click "Add New Application Password"</li>
                    <li>Copy the generated password exactly (including spaces)</li>
                    <li>Use your WordPress username (not email) and the application password</li>
                  </ol>
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <p className="text-xs text-gray-600">
                      <strong>Format:</strong> xxxx xxxx xxxx xxxx (with spaces)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-2">Issue #3: Access Forbidden (403 Error)</h3>
                <p className="text-purple-700 text-sm mb-3">
                  Your user account doesn't have sufficient permissions.
                </p>
                <div className="bg-white p-3 rounded border text-sm">
                  <p className="font-medium mb-2">Solution:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Ensure your user has "Editor" or "Administrator" role</li>
                    <li>Check if security plugins are blocking API access</li>
                    <li>Temporarily disable security plugins to test</li>
                    <li>Add this to your wp-config.php if needed:</li>
                  </ol>
                  <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span>define('WP_DEBUG', true);</span>
                      <button
                        onClick={() => copyToClipboard("define('WP_DEBUG', true);")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Manual Testing Steps</h3>
                <p className="text-green-700 text-sm mb-3">
                  Test your WordPress REST API manually to identify the issue.
                </p>
                <div className="bg-white p-3 rounded border text-sm">
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                      <strong>Test REST API availability:</strong>
                      <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                        <span>https://yoursite.com/wp-json/wp/v2</span>
                        <button
                          onClick={() => copyToClipboard("https://yoursite.com/wp-json/wp/v2")}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Should return JSON with API information</p>
                    </li>
                    <li>
                      <strong>Test authentication:</strong>
                      <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                        <span>https://yoursite.com/wp-json/wp/v2/users/me</span>
                        <button
                          onClick={() => copyToClipboard("https://yoursite.com/wp-json/wp/v2/users/me")}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Use Basic Auth with username:password</p>
                    </li>
                    <li>
                      <strong>Check browser console</strong> for CORS or other errors
                    </li>
                    <li>
                      <strong>Verify SSL certificate</strong> if using HTTPS
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
            <div className="flex items-start">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Additional Resources</h3>
                <div className="space-y-2 text-sm">
                  <a
                    href="https://developer.wordpress.org/rest-api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-800 underline"
                  >
                    WordPress REST API Documentation
                  </a>
                  <a
                    href="https://wordpress.org/support/article/application-passwords/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-800 underline"
                  >
                    WordPress Application Passwords Guide
                  </a>
                  <a
                    href="https://wordpress.org/support/article/using-permalinks/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-800 underline"
                  >
                    WordPress Permalinks Settings
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordPressTroubleshooter;
