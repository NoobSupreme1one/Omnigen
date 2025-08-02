import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/wordpressService';

interface CategorySelectorProps {
  userId: string;
  onCategorySelected: (categoryId: number) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ userId, onCategorySelected }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories(userId);
        setCategories(fetchedCategories);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchCategories();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Select a Category</h2>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <ul className="mt-4 text-left">
          {categories.map((category) => (
            <li key={category.id} className="border-b py-2">
              <button
                onClick={() => onCategorySelected(category.id)}
                className="w-full text-left bg-transparent hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategorySelector;
