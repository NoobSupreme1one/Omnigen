import React, { useState } from 'react';
import { publishArticle } from '../services/wordpressService';
import ArticleEditor from './ArticleEditor';

interface PublishingProps {
  userId: string;
  articleContent: string;
  featuredImage: string | null;
  categoryId: number;
  onPublished: () => void;
}

const Publishing: React.FC<PublishingProps> = ({ userId, articleContent, featuredImage, categoryId, onPublished }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedArticle, setEditedArticle] = useState(articleContent);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishSuccess(false);
    setError(null);
    try {
      await publishArticle(userId, 'New Article', editedArticle, categoryId, featuredImage);
      setPublishSuccess(true);
      onPublished();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Preview & Publish</h2>
        {featuredImage && <img src={featuredImage} alt="Featured Image" className="mt-4" />}
        <ArticleEditor
          content={editedArticle}
          onContentChange={setEditedArticle}
        />
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="mt-4 w-full bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isPublishing ? 'Publishing...' : 'Publish to WordPress'}
        </button>
        {publishSuccess && <p className="text-green-500 mt-4">Article published successfully!</p>}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Publishing;
