export interface WordpressCredentials {
  url: string;
  username: string;
  password: string; // This will be an application password
}

const getStorageKey = (userId: string) => `wp_credentials_${userId}`;

export const saveWordpressCredentials = (userId: string, credentials: WordpressCredentials): void => {
  try {
    // Validate URL format
    const url = new URL(credentials.url);
    if (!url.protocol.startsWith('http')) {
      throw new Error('URL must start with http:// or https://');
    }
    
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save WordPress credentials to localStorage:', error);
    throw error;
  }
};

export const getWordpressCredentials = (userId: string): WordpressCredentials | null => {
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve WordPress credentials from localStorage:', error);
    return null;
  }
};

export const deleteWordpressCredentials = (userId: string): void => {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete WordPress credentials from localStorage:', error);
  }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, credentials: WordpressCredentials, options: RequestInit = {}) => {
  const { username, password } = credentials;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.code) {
        errorMessage = `${errorData.code}: ${errorData.message || errorData.data?.message || 'Unknown error'}`;
      }
    } catch {
      // If we can't parse the error as JSON, use the raw text
      if (errorText) {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
  }

  return response;
};

export const getCategories = async (userId: string): Promise<any[]> => {
  const credentials = getWordpressCredentials(userId);
  if (!credentials) {
    throw new Error('WordPress credentials not found. Please connect to WordPress first.');
  }

  const { url } = credentials;
  const endpoint = `${url}/wp-json/wp/v2/categories`;

  try {
    const response = await makeAuthenticatedRequest(endpoint, credentials);
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getArticles = async (userId: string, categoryId: number): Promise<any[]> => {
  const credentials = getWordpressCredentials(userId);
  if (!credentials) {
    throw new Error('WordPress credentials not found. Please connect to WordPress first.');
  }

  const { url } = credentials;
  const endpoint = `${url}/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100`;

  try {
    const response = await makeAuthenticatedRequest(endpoint, credentials);
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const publishArticle = async (userId: string, title: string, content: string, categoryId: number, featuredImage: string | null): Promise<any> => {
  try {
    const credentials = getWordpressCredentials(userId);
    if (!credentials) {
      throw new Error('WordPress credentials not found. Please connect to WordPress first.');
    }

    const { url } = credentials;
    let featuredImageId: number | null = null;

    // Upload featured image if provided
    if (featuredImage) {
      try {
        const imageResponse = await fetch(featuredImage);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        const formData = new FormData();
        formData.append('file', imageBlob, 'featured-image.png');

        const mediaEndpoint = `${url}/wp-json/wp/v2/media`;
        const mediaResponse = await fetch(mediaEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`),
          },
          body: formData,
        });

        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text();
          throw new Error(`Failed to upload featured image: ${mediaResponse.statusText}. ${errorText}`);
        }

        const mediaData = await mediaResponse.json();
        featuredImageId = mediaData.id;
      } catch (error) {
        console.warn('Failed to upload featured image, continuing without it:', error);
        // Continue without featured image rather than failing the entire operation
      }
    }

    // Publish the article
    const postsEndpoint = `${url}/wp-json/wp/v2/posts`;
    const postData = {
      title,
      content,
      status: 'publish',
      categories: [categoryId],
      ...(featuredImageId && { featured_media: featuredImageId }),
    };

    const response = await makeAuthenticatedRequest(postsEndpoint, credentials, {
      method: 'POST',
      body: JSON.stringify(postData),
    });

    const result = await response.json();
    console.log('Article published successfully:', result);
    return result;
  } catch (error) {
    console.error('Error publishing article:', error);
    throw new Error(`Failed to publish article: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test connection function
export const testConnection = async (userId: string): Promise<boolean> => {
  try {
    const credentials = getWordpressCredentials(userId);
    if (!credentials) {
      throw new Error('WordPress credentials not found.');
    }

    const { url } = credentials;
    const endpoint = `${url}/wp-json/wp/v2/users/me`;

    await makeAuthenticatedRequest(endpoint, credentials);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
};
