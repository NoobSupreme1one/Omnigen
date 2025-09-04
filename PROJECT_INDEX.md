# 📚 Omnigen - Project Documentation Index

> AI-Powered Content Generation Platform - Complete Documentation Reference

## 🎯 Project Overview

**Omnigen** is a comprehensive AI-powered platform that helps you create, edit, and publish complete books, articles, and multimedia content from simple prompts. The platform supports book creation, article generation, WordPress automation, and online course development.

**Current Status**: Production-ready with active development
**Technology Stack**: React 18 + TypeScript, Vite, Tailwind CSS, Supabase
**AI Integration**: Google Gemini, Perplexity AI, OpenAI, OpenRouter

---

## 📋 Quick Navigation

### 🚀 Getting Started
- [Main README](README.md) - Installation and setup guide
- [Quick Setup](QUICK_SETUP.md) - Fast deployment instructions
- [OpenRouter Setup](OPENROUTER_SETUP.md) - AI service configuration
- [Local Development](docs/LOCAL_DEVELOPMENT.md) - Development environment setup

### 📖 Core Documentation
- [Product Requirements](PRODUCT_REQUIREMENTS.md) - Online course generator specifications
- [Contributing Guide](CONTRIBUTING.md) - Development workflow and guidelines
- [Gemini Integration](GEMINI.md) - AI service implementation details

### 🎨 UI/UX Documentation
- [UI Implementation Plan](UI_UX_IMPLEMENTATION_PLAN.md) - Interface design roadmap
- [UI Improvement Report](UI_UX_IMPROVEMENT_REPORT.md) - Enhancement analysis

---

## 🏗️ Architecture Reference

### Core Application Structure
```
src/
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
├── components/                 # React UI components (28 files)
├── services/                   # Business logic & API integrations (20 services)
├── types/                      # TypeScript type definitions
├── lib/                        # Configuration & utilities
└── utils/                      # Helper functions
```

### 🔧 Components Architecture
**Location**: `src/components/` (28 components)

#### Core Content Creation
- `BookEditor.tsx` - Main book editing interface
- `BookPrompt.tsx` - Initial book creation wizard
- `ChapterView.tsx` - Individual chapter management
- `OutlineView.tsx` - Book structure overview

#### Multimedia Generation
- `AudiobookGenerator.tsx` - Text-to-speech conversion
- `AudioPlayer.tsx` - Audio playback controls
- `OnlineCourseChapterView.tsx` - Course content management

#### WordPress Integration
- `WordpressGenerator.tsx` - Article automation
- `WordpressSettings.tsx` - Site configuration
- `WordPressTroubleshooter.tsx` - Debug tools
- `WordPressManagement.tsx` - Multi-site management
- `AutoPublishing.tsx` - Scheduled publishing

#### User Management
- `AuthWrapper.tsx` - Authentication system
- `UserSettings.tsx` - User configuration
- `APISettings.tsx` - API key management

#### Content Organization
- `PersonaManagement.tsx` - Writing style profiles
- `PersonaCreationModal.tsx` - Style creation interface
- `CategorySelector.tsx` - Content categorization
- `TopicSelector.tsx` - Topic selection interface

### ⚙️ Services Architecture
**Location**: `src/services/` (20 services)

#### AI & Content Generation
- `geminiService.ts` - Google Gemini AI integration
- `openRouterService.ts` - Multi-model AI router
- `vertexService.ts` - Google Vertex AI integration
- `perplexityService.ts` - Research AI integration
- `contentService.ts` - Content generation orchestration
- `editingService.ts` - Content editing workflows

#### WordPress Automation
- `wordpressService.ts` - WordPress API integration
- `wordpressDebugService.ts` - Debug & troubleshooting
- `articleGenerationService.ts` - Article creation automation
- `autoPublishingService.ts` - Automated publishing
- `autoPublishingScheduler.ts` - Scheduling system
- `schedulingService.ts` - Publication timing

#### User & Content Management
- `userService.ts` - User account management
- `userSettingsService.ts` - User preferences
- `bookService.ts` - Book data management
- `personaService.ts` - Writing persona system
- `blogAnalysisService.ts` - Content analytics

#### Specialized Services
- `ttsService.ts` - Text-to-speech conversion
- `coverService.ts` - Book cover generation
- `exportService.ts` - Multi-format export
- `onlineCourseService.ts` - Course creation
- `automationController.ts` - Workflow automation
- `automationLogger.ts` - Activity logging

### 📊 Type System
**Location**: `src/types/index.ts`

#### Core Content Types
```typescript
interface Book {
  id: string;
  title: string;
  chapters: BookChapter[];
  writingPersona?: WritingPersona;
  // ... complete book metadata
}

interface BookChapter {
  id: string;
  title: string;
  subChapters?: SubChapter[];
  status: 'pending' | 'generating' | 'completed';
}
```

#### WordPress Integration Types
```typescript
interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  appPassword: string;
}

interface PublicationSchedule {
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduleConfig: ScheduleConfig;
  articleTemplate?: ArticleTemplate;
}
```

#### Writing Persona System
```typescript
interface WritingPersona {
  id: string;
  name: string;
  analysisResults?: PersonaAnalysis;
  preferences: PersonaPreferences;
}
```

---

## 📚 Feature Documentation

### 🤖 AI Content Generation
**Status**: Production Ready

#### Supported Models
- **Google Gemini** (Primary) - High-quality content generation
- **OpenRouter** - Multi-model access (GPT, Claude, etc.)
- **Perplexity AI** - Research and fact-checking
- **Vertex AI** - Google Cloud integration

#### Content Types
- **Books**: Multi-chapter with sub-chapters, multiple genres
- **Articles**: WordPress-optimized with SEO
- **Courses**: Structured lessons with scripts
- **Audiobooks**: Text-to-speech with voice selection

### 👤 Writing Persona System
**Status**: Production Ready
**Documentation**: [Writing Personas Guide](docs/WRITING_PERSONAS_GUIDE.md)

#### Features
- AI-powered style analysis from writing samples
- Manual persona creation with detailed attributes
- Genre specialization and audience targeting
- Export/import for sharing and backup

### 📝 WordPress Automation
**Status**: Production Ready
**Documentation**: 
- [WordPress Setup](docs/WORDPRESS_SETUP.md)
- [Auto Publishing Guide](docs/AUTO_PUBLISHING_GUIDE.md)
- [Scheduling Guide](docs/WORDPRESS_SCHEDULING_GUIDE.md)

#### Capabilities
- Multi-site management
- Automated article generation
- Scheduled publishing
- SEO optimization
- Featured image generation
- Category and tag automation

### 🎧 Multimedia Generation
**Status**: Production Ready

#### Audiobook Generation
- Text-to-speech with multiple voice options
- Chapter-by-chapter processing
- Audio export with metadata
- Voice recommendation based on content

#### Visual Content
- AI-generated book covers (DALL-E integration)
- Featured images for articles
- Course presentation graphics

### 📖 Online Course Generator
**Status**: In Development
**Documentation**: [Product Requirements](PRODUCT_REQUIREMENTS.md)

#### Phase 1 Complete
- Course outline generation
- Module-based structure
- Blog article creation
- Lesson plan generation

#### Phase 2 Complete
- Featured image generation
- Text-to-speech for scripts
- Audio playbook controls

#### Phase 3 (Planned)
- Google Slides integration
- Automated presentation creation
- OAuth authentication

---

## 🛠️ Development Guides

### 📋 Setup & Configuration
1. **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Development environment
2. **[Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)** - Authentication integration
3. **[Vertex AI Setup](docs/VERTEX_AI_IMAGEN_SETUP.md)** - Image generation
4. **[Google AI Image Generation](docs/GOOGLE_AI_IMAGE_GENERATION.md)** - Cover creation

### 🔧 Technical Implementation
- **Build System**: Vite with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks with context
- **Database**: Supabase with real-time features
- **Authentication**: Supabase Auth with email/password

### 🧪 Testing
**Framework**: Playwright
**Test Suites**:
- `tests/articles.spec.ts` - Article generation testing
- `tests/wordpress.spec.ts` - WordPress integration
- `tests/wordpress-integration.spec.ts` - End-to-end workflows

### 📦 Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run preview      # Preview build
npm run test:imagen  # Test image generation
npm run test:vertex  # Test Vertex AI
npm run test:prompts # Test cover prompts
```

---

## 🚀 Deployment & Production

### Environment Configuration
**Required Environment Variables**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API Keys Required
- **Google Gemini**: Content generation (required)
- **Perplexity AI**: Research enhancement (optional)
- **OpenAI**: Cover generation (optional)
- **OpenRouter**: Multi-model access (optional)

### Database Setup
**Platform**: Supabase
**Features**: Real-time subscriptions, Row Level Security
**Migrations**: Available in `/supabase/migrations/`

---

## 📊 Project Metrics

### Codebase Statistics
- **Components**: 28 React components
- **Services**: 20 business logic services
- **Test Files**: 3 comprehensive test suites
- **Documentation**: 15+ guide documents
- **Dependencies**: Modern, well-maintained packages

### Feature Coverage
- ✅ **Book Generation**: Complete with multi-chapter support
- ✅ **WordPress Integration**: Full automation pipeline
- ✅ **Writing Personas**: AI analysis and management
- ✅ **Audiobook Creation**: Text-to-speech with voice options
- ✅ **Export Systems**: PDF, EPUB, Audio packages
- 🚧 **Online Courses**: Core features complete, Google Slides pending
- 📋 **Mobile App**: Planned for future development

---

## 🎯 Roadmap & Future Development

### Upcoming Features
- [ ] Collaborative editing capabilities
- [ ] Advanced style templates
- [ ] Multi-language support
- [ ] Publishing platform integrations
- [ ] Advanced analytics and insights
- [ ] Mobile application development

### Recent Achievements
- ✅ Writing personas system with AI analysis
- ✅ Export/import functionality
- ✅ Professional audiobook generation
- ✅ WordPress automation with scheduling
- ✅ Multi-format export (PDF/EPUB)
- ✅ AI cover generation integration

---

## 🤝 Contributing & Support

### Development Workflow
1. Fork repository and create feature branch
2. Follow TypeScript and React best practices
3. Add tests for new functionality
4. Submit pull request with clear description

### Code Standards
- **TypeScript**: Required for all new code
- **Component Structure**: Functional components with hooks
- **Styling**: Tailwind CSS with semantic class names
- **Testing**: Playwright for integration tests

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/NoobSupreme1one/Omnigen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/NoobSupreme1one/Omnigen/discussions)
- **Wiki**: [Project Wiki](https://github.com/NoobSupreme1one/Omnigen/wiki)

---

## 📄 License & Acknowledgments

**License**: MIT License - Open source and free to use
**AI Partners**: Google Gemini, OpenAI, Perplexity AI
**Infrastructure**: Supabase for backend services
**Community**: Open source contributors and users

---

*Last Updated: August 2025*
*Version: 1.0.0*