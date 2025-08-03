import { WordPressSite } from '../types';

export interface WordPressDebugResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  suggestion?: string;
}

export class WordPressDebugger {
  private site: Partial<WordPressSite>;
  private results: WordPressDebugResult[] = [];

  constructor(site: Partial<WordPressSite>) {
    this.site = site;
  }

  async runFullDiagnostic(): Promise<WordPressDebugResult[]> {
    this.results = [];
    
    // Step 1: Validate URL format
    await this.validateURL();
    
    // Step 2: Check site accessibility
    await this.checkSiteAccessibility();
    
    // Step 3: Check REST API availability
    await this.checkRestAPI();
    
    // Step 4: Test authentication
    await this.testAuthentication();
    
    // Step 5: Check user permissions
    await this.checkUserPermissions();
    
    // Step 6: Test specific endpoints
    await this.testEndpoints();
    
    return this.results;
  }

  private addResult(step: string, status: 'success' | 'error' | 'warning', message: string, details?: any, suggestion?: string) {
    this.results.push({ step, status, message, details, suggestion });
  }

  private async validateURL() {
    try {
      if (!this.site.url) {
        this.addResult('URL Validation', 'error', 'No URL provided', null, 'Please enter your WordPress site URL');
        return;
      }

      const url = new URL(this.site.url);
      
      if (!url.protocol.startsWith('http')) {
        this.addResult('URL Validation', 'error', 'Invalid protocol', { protocol: url.protocol }, 'URL must start with http:// or https://');
        return;
      }

      if (url.protocol === 'http:') {
        this.addResult('URL Validation', 'warning', 'Using HTTP instead of HTTPS', null, 'Consider using HTTPS for better security');
      }

      // Remove trailing slash for consistency
      this.site.url = this.site.url.replace(/\/$/, '');
      
      this.addResult('URL Validation', 'success', `Valid URL: ${this.site.url}`);
    } catch (error) {
      this.addResult('URL Validation', 'error', 'Invalid URL format', { error: error.message }, 'Please check your URL format (e.g., https://yoursite.com)');
    }
  }

  private async checkSiteAccessibility() {
    try {
      const response = await fetch(this.site.url!, {
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for basic connectivity test
      });
      
      this.addResult('Site Accessibility', 'success', 'Site is accessible');
    } catch (error) {
      this.addResult('Site Accessibility', 'error', 'Cannot reach site', { error: error.message }, 'Check if your site is online and accessible');
    }
  }

  private async checkRestAPI() {
    try {
      const apiUrl = `${this.site.url}/wp-json/wp/v2`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        this.addResult('REST API', 'success', 'WordPress REST API is available', { 
          namespace: data.namespace,
          routes: Object.keys(data.routes || {}).length 
        });
      } else if (response.status === 404) {
        this.addResult('REST API', 'error', 'WordPress REST API not found', { status: response.status }, 'Ensure WordPress REST API is enabled. Check if permalinks are set to something other than "Plain"');
      } else {
        this.addResult('REST API', 'error', `REST API returned ${response.status}`, { status: response.status, statusText: response.statusText });
      }
    } catch (error) {
      this.addResult('REST API', 'error', 'Failed to access REST API', { error: error.message }, 'Check if WordPress REST API is enabled and accessible');
    }
  }

  private async testAuthentication() {
    try {
      if (!this.site.username || !this.site.appPassword) {
        this.addResult('Authentication', 'error', 'Missing credentials', null, 'Please provide both username and application password');
        return;
      }

      const credentials = btoa(`${this.site.username}:${this.site.appPassword}`);
      const response = await fetch(`${this.site.url}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.addResult('Authentication', 'success', 'Authentication successful', {
          user: userData.name,
          roles: userData.roles,
          id: userData.id
        });
      } else if (response.status === 401) {
        const errorData = await response.text();
        this.addResult('Authentication', 'error', 'Authentication failed', { 
          status: response.status,
          error: errorData 
        }, 'Check your username and application password. Make sure the application password is correctly formatted (xxxx xxxx xxxx xxxx)');
      } else if (response.status === 403) {
        this.addResult('Authentication', 'error', 'Access forbidden', { status: response.status }, 'User may not have sufficient permissions');
      } else {
        const errorData = await response.text();
        this.addResult('Authentication', 'error', `Authentication error: ${response.status}`, { 
          status: response.status,
          error: errorData 
        });
      }
    } catch (error) {
      this.addResult('Authentication', 'error', 'Authentication request failed', { error: error.message });
    }
  }

  private async checkUserPermissions() {
    try {
      const credentials = btoa(`${this.site.username}:${this.site.appPassword}`);
      
      // Test if user can create posts
      const testPostData = {
        title: 'BookGen Connection Test',
        content: 'This is a test post to verify permissions.',
        status: 'draft' // Create as draft to avoid publishing
      };

      const response = await fetch(`${this.site.url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPostData)
      });

      if (response.ok) {
        const postData = await response.json();
        this.addResult('User Permissions', 'success', 'User can create posts', { postId: postData.id });
        
        // Clean up test post
        await fetch(`${this.site.url}/wp-json/wp/v2/posts/${postData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${credentials}`,
          }
        });
      } else if (response.status === 403) {
        this.addResult('User Permissions', 'error', 'User cannot create posts', { status: response.status }, 'User needs "publish_posts" capability. Check user role and permissions.');
      } else {
        const errorData = await response.text();
        this.addResult('User Permissions', 'warning', 'Could not verify post creation permissions', { 
          status: response.status,
          error: errorData 
        });
      }
    } catch (error) {
      this.addResult('User Permissions', 'warning', 'Permission check failed', { error: error.message });
    }
  }

  private async testEndpoints() {
    const credentials = btoa(`${this.site.username}:${this.site.appPassword}`);
    const endpoints = [
      { name: 'Categories', url: '/wp-json/wp/v2/categories' },
      { name: 'Tags', url: '/wp-json/wp/v2/tags' },
      { name: 'Media', url: '/wp-json/wp/v2/media' },
      { name: 'Posts', url: '/wp-json/wp/v2/posts' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.site.url}${endpoint.url}`, {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.addResult(`${endpoint.name} Endpoint`, 'success', `${endpoint.name} endpoint accessible`, { 
            count: Array.isArray(data) ? data.length : 'N/A' 
          });
        } else {
          this.addResult(`${endpoint.name} Endpoint`, 'warning', `${endpoint.name} endpoint returned ${response.status}`, { 
            status: response.status 
          });
        }
      } catch (error) {
        this.addResult(`${endpoint.name} Endpoint`, 'error', `Failed to access ${endpoint.name} endpoint`, { 
          error: error.message 
        });
      }
    }
  }
}

// Helper function to test WordPress connection with detailed diagnostics
export const debugWordPressConnection = async (site: Partial<WordPressSite>): Promise<WordPressDebugResult[]> => {
  const wpDebugger = new WordPressDebugger(site);
  return await wpDebugger.runFullDiagnostic();
};

// Quick connection test (simplified version)
export const quickConnectionTest = async (url: string, username: string, appPassword: string): Promise<boolean> => {
  try {
    const credentials = btoa(`${username}:${appPassword}`);
    const response = await fetch(`${url}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Common WordPress issues and solutions
export const getCommonSolutions = (): Array<{issue: string, solution: string}> => {
  return [
    {
      issue: "REST API not found (404)",
      solution: "Go to WordPress Admin → Settings → Permalinks and change from 'Plain' to any other option (like 'Post name'), then save."
    },
    {
      issue: "Authentication failed (401)",
      solution: "1. Verify username is correct\n2. Generate a new Application Password in WordPress Admin → Users → Profile\n3. Copy the password exactly as shown (with spaces)"
    },
    {
      issue: "Access forbidden (403)",
      solution: "User needs 'Editor' or 'Administrator' role. Check user permissions in WordPress Admin → Users."
    },
    {
      issue: "CORS errors",
      solution: "Add CORS headers to WordPress or use a plugin like 'WP CORS' to allow cross-origin requests."
    },
    {
      issue: "SSL certificate errors",
      solution: "Ensure your WordPress site has a valid SSL certificate, or temporarily use HTTP instead of HTTPS for testing."
    },
    {
      issue: "Plugin conflicts",
      solution: "Temporarily deactivate security plugins or plugins that might block REST API access."
    }
  ];
};
