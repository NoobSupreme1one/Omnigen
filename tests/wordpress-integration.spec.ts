import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WordpressSettings from '../src/components/WordpressSettings';
import WordpressGenerator from '../src/components/WordpressGenerator';

// Mock the services
vi.mock('../src/services/wordpressService', () => ({
  saveWordpressCredentials: vi.fn(),
  getWordpressCredentials: vi.fn(),
  deleteWordpressCredentials: vi.fn(),
  getCategories: vi.fn(),
  getArticles: vi.fn(),
  publishArticle: vi.fn(),
}));

vi.mock('../src/services/geminiService', () => ({
  analyzeContentAndGenerateTopics: vi.fn(),
  generateArticle: vi.fn(),
}));

vi.mock('../src/services/coverService', () => ({
  generateFeaturedImage: vi.fn(),
}));

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

describe('WordPress Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('WordpressSettings Component', () => {
    it('should render the WordPress configuration form', () => {
      render(<WordpressSettings />);
      
      expect(screen.getByText('WordPress Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('WordPress URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Application Password')).toBeInTheDocument();
      expect(screen.getByText('Connect to WordPress')).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      const onConnect = vi.fn();
      render(<WordpressSettings onConnect={onConnect} />);
      
      const urlInput = screen.getByLabelText('WordPress URL');
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Application Password');
      const submitButton = screen.getByText('Connect to WordPress');
      
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });

    it('should show error for invalid URL', async () => {
      render(<WordpressSettings />);
      
      const urlInput = screen.getByLabelText('WordPress URL');
      const submitButton = screen.getByText('Connect to WordPress');
      
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/URL must start with http/)).toBeInTheDocument();
      });
    });
  });

  describe('WordpressGenerator Component', () => {
    it('should render without crashing', () => {
      render(<WordpressGenerator />);
      // The component should render without errors
      expect(document.body).toBeInTheDocument();
    });

    it('should accept props correctly', () => {
      const mockApiKeys = {
        gemini: 'test-gemini-key',
        perplexity: 'test-perplexity-key'
      };
      
      render(<WordpressGenerator apiKeys={mockApiKeys} />);
      // Component should render without errors
      expect(document.body).toBeInTheDocument();
    });
  });
}); 