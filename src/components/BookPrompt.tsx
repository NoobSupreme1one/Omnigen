import React, { useState } from 'react';
import { BookOpen, Sparkles, Wand2, User, ChevronDown, Loader, RefreshCw, Plus } from 'lucide-react';
import { generateBookOutline } from '../services/geminiService';
import { generateBookDescription } from '../services/perplexityService';
import { Book, WritingPersona } from '../types';
import { getUserProfile } from '../services/userService';
import { getUserPersonas, generateContentWithPersona } from '../services/personaService';
import PersonaCreationModal from './PersonaCreationModal';
import PubHubLogo from './PubHubLogo';

interface BookPromptProps {
  onGenerate: (book: Book) => void;
  apiKeys: {gemini: string; perplexity: string};
}

const GENRES = [
  'Romance',
  'Fantasy',
  'Science Fiction',
  'Mystery/Thriller',
  'Historical Fiction',
  'Contemporary Fiction',
  'Young Adult',
  'Non-Fiction',
  'Self-Help',
  'Business',
  'Biography/Memoir',
  'Online Course', // Added new genre
  'Other'
];

const HEAT_LEVELS = [
  {
    value: 'clean',
    label: 'Clean/Wholesome',
    description: 'Focus on romantic love and connection without explicit sexual content. Limited to kissing, hugs, and meaningful glances.'
  },
  {
    value: 'sweet',
    label: 'Sweet',
    description: 'Closed-door scenes where intimate moments are implied. Focus on emotional development and declarations of love.'
  },
  {
    value: 'sensual',
    label: 'Sensual/Warm',
    description: 'On-page love scenes with euphemistic language, focusing on emotional aspects rather than explicit details.'
  },
  {
    value: 'steamy',
    label: 'Steamy/Hot',
    description: 'Explicit sexual content with detailed descriptions and multiple intimate scenes.'
  },
  {
    value: 'spicy',
    label: 'Spicy/Erotic',
    description: 'Heavy emphasis on sexual activity with detailed descriptions, including side character interactions.'
  },
  {
    value: 'explicit',
    label: 'Explicit/Pornographic',
    description: 'Highly detailed and graphic descriptions of sexual acts, exploring characters\' sexual desires in detail.'
  }
];

const BookPrompt: React.FC<BookPromptProps> = ({ onGenerate, apiKeys }) => {
  const [prompt, setPrompt] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [tone, setTone] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [heatLevel, setHeatLevel] = useState('');
  const [perspective, setPerspective] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [targetAudience, setTargetAudience] = useState('');
  const [personas, setPersonas] = useState<WritingPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<WritingPersona | null>(null);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);

  // Load user's default author name and personas on component mount
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const [profile, userPersonas] = await Promise.all([
          getUserProfile(),
          getUserPersonas()
        ]);

        if (profile?.default_author_name) {
          setAuthor(profile.default_author_name);
        }

        setPersonas(userPersonas);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Don't show error to user, just continue without auto-fill
      }
    };

    loadUserData();
  }, []);

  const handlePersonaCreated = async (newPersona: WritingPersona) => {
    // Refresh the personas list
    try {
      const updatedPersonas = await getUserPersonas();
      setPersonas(updatedPersonas);
      setSelectedPersona(newPersona);
      setShowPersonaModal(false);
      setShowPersonaDropdown(false);
    } catch (error) {
      console.error('Error refreshing personas:', error);
    }
  };

  const ROMANCE_SUBGENRES = [
    'Contemporary',
    'Historical',
    'Paranormal',
    'Fantasy',
    'Regency',
    'Western',
    'Romantic Suspense',
    'Military',
    'Sports',
    'Billionaire/CEO',
    'Small Town',
    'Second Chance',
    'Enemies to Lovers',
    'Friends to Lovers',
    'Fake Relationship',
    'Single Parent',
    'Holiday/Christmas',
    'Medical',
    'Motorcycle Club/Biker',
    'Mafia',
    'Royal',
    'Time Travel',
    'Alien/Sci-Fi',
    'Vampire/Shifter',
    'Gothic',
    'Inspirational/Christian'
  ];

  const PERSPECTIVES = [
    {
      value: 'first',
      label: 'First Person',
      description: 'Narrated from "I" perspective, offering intimate access to one character\'s thoughts and feelings'
    },
    {
      value: 'third-limited',
      label: 'Third Person Limited',
      description: 'Narrated from "he/she" perspective, following one character\'s viewpoint'
    },
    {
      value: 'third-omniscient',
      label: 'Third Person Omniscient',
      description: 'Narrated from "he/she" perspective with access to multiple characters\' thoughts'
    },
    {
      value: 'second',
      label: 'Second Person',
      description: 'Narrated from "you" perspective, addressing the reader directly (rare but powerful)'
    }
  ];

  const generateDescription = async () => {
    if (!genre) {
      alert('Please select a genre first to generate a description.');
      return;
    }

    if (!apiKeys.perplexity) {
      alert('Perplexity API key is required to generate descriptions. Please check your settings.');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      console.log('🚀 Generating description with Perplexity...');

      const actualTone = tone === 'Other' ? customTone : tone;

      const generatedDescription = await generateBookDescription(
        genre,
        subGenre && isRomance ? subGenre : undefined,
        actualTone,
        perspective,
        heatLevel && isRomance ? heatLevel : undefined,
        targetAudience,
        apiKeys.perplexity
      );

      if (!generatedDescription) {
        throw new Error('No description generated. The content may have been filtered.');
      }

      setPrompt(generatedDescription.trim());
      console.log('✅ Description generated successfully with Perplexity');

    } catch (error) {
      console.error('❌ Error generating description with Perplexity:', error);
      let errorMessage = 'Failed to generate description. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
        } else if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          errorMessage = 'Invalid Perplexity API key. Please check your API key in settings.';
        } else if (error.message.includes('forbidden') || error.message.includes('403')) {
          errorMessage = 'API access forbidden. Please check your Perplexity API permissions.';
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Enhance prompt with persona style if selected
      let enhancedPrompt = prompt;
      if (selectedPersona && selectedPersona.analysisResults) {
        const analysis = selectedPersona.analysisResults;
        enhancedPrompt += `\n\nWriting Style Instructions:
- Sentence length: ${analysis.writingStyle.sentenceLength}
- Vocabulary level: ${analysis.writingStyle.vocabulary}
- Tone: ${analysis.writingStyle.tone.join(', ')}
- Voice characteristics: ${analysis.writingStyle.voiceCharacteristics.join(', ')}
- Paragraph style: ${analysis.structuralElements.paragraphLength}
- Pacing: ${analysis.structuralElements.pacing}`;

        if (analysis.strengthsAndQuirks.length > 0) {
          enhancedPrompt += `\n- Key characteristics: ${analysis.strengthsAndQuirks.join(', ')}`;
        }
      }

      if (selectedPersona && selectedPersona.preferences.specialInstructions) {
        enhancedPrompt += `\n\nAdditional instructions: ${selectedPersona.preferences.specialInstructions}`;
      }

      // Use persona's author name if available
      const finalAuthor = selectedPersona?.authorName || author;

      // For Online Course genre, pass the generateAudio option
      if (isOnlineCourse) {
        const book = await generateBookOutline(enhancedPrompt, genre, subGenre, targetAudience, heatLevel, perspective, finalAuthor, undefined, generateAudio);
        
        // Add persona reference to the book
        const bookWithPersona = {
          ...book,
          writingPersonaId: selectedPersona?.id,
          writingPersona: selectedPersona || undefined
        };

        onGenerate(bookWithPersona);
      } else {
        const book = await generateBookOutline(enhancedPrompt, genre, subGenre, targetAudience, heatLevel, perspective, finalAuthor, undefined);

        // Add persona reference to the book
        const bookWithPersona = {
          ...book,
          writingPersonaId: selectedPersona?.id,
          writingPersona: selectedPersona || undefined
        };

        onGenerate(bookWithPersona);
      }
    } catch (error) {
      console.error('Error generating book outline:', error);
      alert('Failed to generate book outline. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isRomance = genre.toLowerCase() === 'romance';
  const isOnlineCourse = genre.toLowerCase() === 'online course';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PubHubLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your eBook</h2>
          <p className="text-gray-600">Describe the book you want to create and let PubHub's AI generate a comprehensive outline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Book Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the book you want to create. Include the topic, main themes, and any specific requirements..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              required
            />
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={generateDescription}
              disabled={isGeneratingDescription || !genre}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isGeneratingDescription ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Description
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                Author Name (from your settings)
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name for this book..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled from your user settings, but you can edit it for this book
              </p>
            </div>

            <div>
              <label htmlFor="persona" className="block text-sm font-medium text-gray-700 mb-2">
                Writing Persona (Optional)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className={selectedPersona ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedPersona ? selectedPersona.name : 'Select a writing persona...'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPersonaDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPersonaDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPersona(null);
                          setShowPersonaDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-600"
                      >
                        No persona (default style)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPersonaModal(true);
                          setShowPersonaDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md text-blue-600 border-b border-gray-200 mb-2"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">Create New Persona</div>
                            <div className="text-xs text-blue-500">Analyze writing style and create persona</div>
                          </div>
                        </div>
                      </button>
                      {personas.map((persona) => (
                        <button
                          key={persona.id}
                          type="button"
                          onClick={() => {
                            setSelectedPersona(persona);
                            setShowPersonaDropdown(false);
                            // Auto-fill author name if persona has one
                            if (persona.authorName && !author) {
                              setAuthor(persona.authorName);
                            }
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-500" />
                            <div>
                              <div className="font-medium text-gray-900">{persona.name}</div>
                              {persona.description && (
                                <div className="text-xs text-gray-500 truncate">{persona.description}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {personas.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No personas created yet</p>
                        <p className="text-xs">Go to Personas to create your first writing style</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedPersona && (
                <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-700 font-medium">Selected: {selectedPersona.name}</p>
                  {selectedPersona.description && (
                    <p className="text-xs text-indigo-600 mt-1">{selectedPersona.description}</p>
                  )}
                  {selectedPersona.analysisResults && (
                    <div className="flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span className="text-xs text-indigo-600">AI-analyzed writing style</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a genre...</option>
                {GENRES.map((genreOption) => (
                  <option key={genreOption} value={genreOption}>
                    {genreOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Entrepreneurs, Students, General readers"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {tone === 'Other' && (
            <div>
              <label htmlFor="customTone" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Tone
              </label>
              <input
                type="text"
                id="customTone"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="Describe your desired tone..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          {isRomance && (
            <div>
              <label htmlFor="subGenre" className="block text-sm font-medium text-gray-700 mb-2">
                Romance Sub-Genre (Optional)
              </label>
              <select
                id="subGenre"
                value={subGenre}
                onChange={(e) => setSubGenre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a sub-genre...</option>
                {ROMANCE_SUBGENRES.map((subGenreOption) => (
                  <option key={subGenreOption} value={subGenreOption}>
                    {subGenreOption}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isRomance && (
            <div>
              <label htmlFor="heatLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Heat Level
              </label>
              <select
                id="heatLevel"
                value={heatLevel}
                onChange={(e) => setHeatLevel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select heat level...</option>
                {HEAT_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {heatLevel && (
                <p className="text-xs text-gray-600 mt-2">
                  {HEAT_LEVELS.find(level => level.value === heatLevel)?.description}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="perspective" className="block text-sm font-medium text-gray-700 mb-2">
              Narrative Perspective (Optional)
            </label>
            <select
              id="perspective"
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select perspective...</option>
              {PERSPECTIVES.map((perspectiveOption) => (
                <option key={perspectiveOption.value} value={perspectiveOption.value}>
                  {perspectiveOption.label}
                </option>
              ))}
            </select>
            {perspective && (
              <p className="text-xs text-gray-600 mt-2">
                {PERSPECTIVES.find(p => p.value === perspective)?.description}
              </p>
            )}
          </div>

          {isOnlineCourse && (
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateAudio}
                  onChange={(e) => setGenerateAudio(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Generate Audio Narration (Text-to-Speech)
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Automatically generate audio narration for each section using AI voice synthesis
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isOnlineCourse ? 'Generating Course...' : 'Generating Outline...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {isOnlineCourse ? 'Generate Course Outline' : 'Generate Book Outline'}
              </>
            )}
          </button>
        </form>

      </div>

      {/* Persona Creation Modal */}
      {showPersonaModal && (
        <PersonaCreationModal
          isOpen={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onPersonaCreated={handlePersonaCreated}
          apiKeys={apiKeys}
        />
      )}
    </div>
  );
};

export default BookPrompt;