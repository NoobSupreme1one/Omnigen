import React, { useState } from 'react';
import CategorySelector from './CategorySelector';
import ArticleList from './ArticleList';
import TopicSelector from './TopicSelector';
import Publishing from './Publishing';
import { analyzeContentAndGenerateTopics, generateArticle } from '../services/geminiService';
import { WritingPersona } from '../types';

interface WordpressGeneratorProps {
  apiKeys?: {
    gemini?: string;
    perplexity?: string;
  };
  persona?: WritingPersona | null;
}

const WordpressGenerator: React.FC<WordpressGeneratorProps> = ({ apiKeys, persona }) => {
  const [step, setStep] = useState('categories');
  const [userId, setUserId] = useState('test-user'); // Hardcoded for now
  const [apiKey, setApiKey] = useState(apiKeys?.gemini || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  const handleCategorySelected = (id: number) => {
    setCategoryId(id);
    setStep('articles');
  };

  const handleArticlesLoaded = async (loadedArticles: any[]) => {
    setArticles(loadedArticles);
    const content = loadedArticles.map(a => a.content.rendered).join('\n\n');
    const result = await analyzeContentAndGenerateTopics(content, apiKey);
    setAnalysis(result.analysis);
    setSuggestedTopics(result.suggestedTopics);
    setStep('topics');
  };

  const handleTopicSelected = async (topic: any) => {
    const article = await generateArticle(topic.title, topic.description, analysis, apiKey);
    setGeneratedArticle(article);
    setStep('publishing');
  };

  const handlePublished = () => {
    setStep('categories');
  };

  return (
    <div>
      {step === 'categories' && <CategorySelector userId={userId} onCategorySelected={handleCategorySelected} />}
      {step === 'articles' && categoryId && <ArticleList userId={userId} categoryId={categoryId} onArticlesLoaded={handleArticlesLoaded} />}
      {step === 'topics' && analysis && suggestedTopics.length > 0 && (
        <TopicSelector
          analysis={analysis}
          suggestedTopics={suggestedTopics}
          onTopicSelected={handleTopicSelected}
        />
      )}
      {step === 'publishing' && generatedArticle && categoryId && (
        <Publishing
          userId={userId}
          articleContent={generatedArticle}
          featuredImage={featuredImage}
          categoryId={categoryId}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
};

export default WordpressGenerator;

