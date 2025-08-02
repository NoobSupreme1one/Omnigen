import React, { useState, useEffect } from 'react';
import { getArticles } from '../services/wordpressService';

interface ArticleListProps {
  userId: string;
  categoryId: number;
  onArticlesLoaded: (articles: any[]) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ userId, categoryId, onArticlesLoaded }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const fetchedArticles = await getArticles(userId, categoryId);
        setArticles(fetchedArticles);
        onArticlesLoaded(fetchedArticles);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchArticles();
  }, [userId, categoryId, onArticlesLoaded]);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Articles</h2>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <ul className="mt-4 text-left">
          {articles.map((article) => (
            <li key={article.id} className="border-b py-2">
              {article.title.rendered}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ArticleList;
