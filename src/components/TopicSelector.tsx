import React from 'react';

interface TopicSelectorProps {
  analysis: any;
  suggestedTopics: any[];
  onTopicSelected: (topic: any) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ analysis, suggestedTopics, onTopicSelected }) => {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Content Analysis & Suggested Topics</h2>
        <div className="mt-8 text-left">
          <h3 className="text-xl font-bold">Content Analysis</h3>
          <p><strong>Writing Style:</strong> {analysis.writingStyle}</p>
          <p><strong>Tone:</strong> {analysis.tone}</p>
          <p><strong>Common Topics:</strong> {analysis.commonTopics}</p>
          <p><strong>SEO Patterns:</strong> {analysis.seoPatterns}</p>
        </div>
        <div className="mt-8 text-left">
          <h3 className="text-xl font-bold">Suggested Topics</h3>
          <ul className="mt-4">
            {suggestedTopics.map((topic, index) => (
              <li key={index} className="border-b py-2">
                <h4 className="font-bold">{topic.title}</h4>
                <p>{topic.description}</p>
                <button
                  onClick={() => onTopicSelected(topic)}
                  className="mt-2 bg-orange-500 text-white py-1 px-3 rounded-lg font-medium hover:bg-orange-600 transition-all duration-200"
                >
                  Generate Article
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;
