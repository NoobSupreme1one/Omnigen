import React, { useState } from 'react';
import { X, Upload, User, Brain, Loader } from 'lucide-react';
import { WritingPersona } from '../types';
import { createPersona, createPersonaFromSample } from '../services/personaService';

interface PersonaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaCreated: (persona: WritingPersona) => void;
  apiKeys: {
    gemini?: string;
    openai?: string;
    perplexity?: string;
  };
}

const PersonaCreationModal: React.FC<PersonaCreationModalProps> = ({
  isOpen,
  onClose,
  onPersonaCreated,
  apiKeys
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'analyze'>('analyze');
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Manual creation form
  const [manualForm, setManualForm] = useState({
    name: '',
    description: '',
    authorName: '',
    preferredGenres: '',
    specialInstructions: ''
  });

  // Analysis form
  const [analysisForm, setAnalysisForm] = useState({
    name: '',
    description: '',
    authorName: '',
    sampleText: ''
  });

  const handleManualCreate = async () => {
    if (!manualForm.name.trim()) return;

    try {
      setIsCreating(true);
      const preferences = {
        preferredGenres: manualForm.preferredGenres.split(',').map(g => g.trim()).filter(Boolean),
        avoidedTopics: [],
        specialInstructions: manualForm.specialInstructions,
        targetAudience: []
      };

      const newPersona = await createPersona(
        manualForm.name,
        manualForm.description,
        manualForm.authorName,
        preferences
      );

      onPersonaCreated(newPersona);
      
      // Reset form
      setManualForm({
        name: '',
        description: '',
        authorName: '',
        preferredGenres: '',
        specialInstructions: ''
      });
    } catch (error) {
      console.error('Error creating persona:', error);
      alert('Failed to create persona. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAnalyzeAndCreate = async () => {
    if (!analysisForm.name.trim() || !analysisForm.sampleText.trim()) return;

    try {
      setIsAnalyzing(true);
      const newPersona = await createPersonaFromSample(
        analysisForm.name,
        analysisForm.description,
        analysisForm.authorName,
        analysisForm.sampleText,
        apiKeys.gemini || ''
      );

      onPersonaCreated(newPersona);
      
      // Reset form
      setAnalysisForm({
        name: '',
        description: '',
        authorName: '',
        sampleText: ''
      });
    } catch (error) {
      console.error('Error analyzing writing sample:', error);
      alert('Failed to analyze writing sample. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New Writing Persona</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'analyze'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Analyze Writing Sample
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Manual Creation
            </div>
          </button>
        </div>

        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persona Name *
              </label>
              <input
                type="text"
                value={analysisForm.name}
                onChange={(e) => setAnalysisForm({ ...analysisForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Stephen King Style, Academic Writer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={analysisForm.description}
                onChange={(e) => setAnalysisForm({ ...analysisForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this writing style"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author Name (Optional)
              </label>
              <input
                type="text"
                value={analysisForm.authorName}
                onChange={(e) => setAnalysisForm({ ...analysisForm, authorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Author name to use with this persona"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Writing Sample *
              </label>
              <textarea
                value={analysisForm.sampleText}
                onChange={(e) => setAnalysisForm({ ...analysisForm, sampleText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
                placeholder="Paste a sample of writing (at least 200 words) that represents the style you want to analyze..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 200 words recommended for accurate analysis
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyzeAndCreate}
                disabled={!analysisForm.name.trim() || !analysisForm.sampleText.trim() || isAnalyzing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze & Create
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persona Name *
              </label>
              <input
                type="text"
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Professional Blogger, Creative Writer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this persona"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author Name (Optional)
              </label>
              <input
                type="text"
                value={manualForm.authorName}
                onChange={(e) => setManualForm({ ...manualForm, authorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Author name to use with this persona"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Genres (Optional)
              </label>
              <input
                type="text"
                value={manualForm.preferredGenres}
                onChange={(e) => setManualForm({ ...manualForm, preferredGenres: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Fantasy, Romance, Business (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={manualForm.specialInstructions}
                onChange={(e) => setManualForm({ ...manualForm, specialInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Any specific writing instructions or preferences..."
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualCreate}
                disabled={!manualForm.name.trim() || isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    Create Persona
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaCreationModal;
