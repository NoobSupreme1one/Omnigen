import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  saveWordpressCredentials, 
  getWordpressCredentials, 
  deleteWordpressCredentials,
  testConnection 
} from '../src/services/wordpressService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('WordPress Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Credentials Management', () => {
    it('should save WordPress credentials', () => {
      const userId = 'test-user';
      const credentials = {
        url: 'https://example.com',
        username: 'testuser',
        password: 'testpass'
      };

      saveWordpressCredentials(userId, credentials);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wp_credentials_test-user',
        JSON.stringify(credentials)
      );
    });

    it('should retrieve WordPress credentials', () => {
      const userId = 'test-user';
      const credentials = {
        url: 'https://example.com',
        username: 'testuser',
        password: 'testpass'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(credentials));

      const result = getWordpressCredentials(userId);

      expect(result).toEqual(credentials);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('wp_credentials_test-user');
    });

    it('should return null when credentials not found', () => {
      const userId = 'test-user';
      localStorageMock.getItem.mockReturnValue(null);

      const result = getWordpressCredentials(userId);

      expect(result).toBeNull();
    });

    it('should delete WordPress credentials', () => {
      const userId = 'test-user';

      deleteWordpressCredentials(userId);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('wp_credentials_test-user');
    });

    it('should validate URL format when saving credentials', () => {
      const userId = 'test-user';
      const invalidCredentials = {
        url: 'invalid-url',
        username: 'testuser',
        password: 'testpass'
      };

      expect(() => {
        saveWordpressCredentials(userId, invalidCredentials);
      }).toThrow('URL must start with http:// or https://');
    });
  });

  describe('API Functions', () => {
    it('should handle missing credentials gracefully', async () => {
      const userId = 'test-user';
      localStorageMock.getItem.mockReturnValue(null);

      await expect(testConnection(userId)).rejects.toThrow(
        'WordPress credentials not found.'
      );
    });

    it('should make authenticated requests with proper headers', async () => {
      const userId = 'test-user';
      const credentials = {
        url: 'https://example.com',
        username: 'testuser',
        password: 'testpass'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(credentials));
      
      const mockResponse = { ok: true, json: () => Promise.resolve({ id: 1, name: 'Test User' }) };
      (fetch as any).mockResolvedValue(mockResponse);

      await testConnection(userId);

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/wp-json/wp/v2/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Basic ' + btoa('testuser:testpass'),
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
}); 