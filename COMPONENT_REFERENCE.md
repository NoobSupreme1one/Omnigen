# 🧩 Omnigen - Component Reference Guide

> Complete reference for all React components in the Omnigen platform

## 📋 Component Categories

### 🏗️ Core Application
| Component | File | Purpose |
|-----------|------|---------|
| **App** | `App.tsx` | Main application container with routing |
| **AuthWrapper** | `AuthWrapper.tsx` | Authentication state management |

### 📖 Book Creation & Management
| Component | File | Purpose |
|-----------|------|---------|
| **BookEditor** | `BookEditor.tsx` | Main book editing interface |
| **BookPrompt** | `BookPrompt.tsx` | Initial book creation wizard |
| **ChapterView** | `ChapterView.tsx` | Individual chapter management |
| **OutlineView** | `OutlineView.tsx` | Book structure overview |
| **BookSidebar** | `BookSidebar.tsx` | Book navigation and actions |

### 🎓 Online Course System
| Component | File | Purpose |
|-----------|------|---------|
| **OnlineCourseChapterView** | `OnlineCourseChapterView.tsx` | Course module management |

### 🎧 Audio & Multimedia
| Component | File | Purpose |
|-----------|------|---------|
| **AudiobookGenerator** | `AudiobookGenerator.tsx` | Text-to-speech conversion |
| **AudioPlayer** | `AudioPlayer.tsx` | Audio playback controls |

### 📝 WordPress Integration
| Component | File | Purpose |
|-----------|------|---------|
| **WordpressGenerator** | `WordpressGenerator.tsx` | Article automation interface |
| **WordpressSettings** | `WordpressSettings.tsx` | Site configuration |
| **WordPressTroubleshooter** | `WordPressTroubleshooter.tsx` | Debug and diagnostics |
| **WordPressManagement** | `WordPressManagement.tsx` | Multi-site management |
| **AutoPublishing** | `AutoPublishing.tsx` | Scheduled publishing system |
| **Publishing** | `Publishing.tsx` | Content publishing controls |

### 📰 Article & Blog Management
| Component | File | Purpose |
|-----------|------|---------|
| **ArticleEditor** | `ArticleEditor.tsx` | Article editing interface |
| **ArticleList** | `ArticleList.tsx` | Article management list |
| **BlogManagement** | `BlogManagement.tsx` | Blog administration |
| **BlogSidebar** | `BlogSidebar.tsx` | Blog navigation |

### 👤 User & Persona Management
| Component | File | Purpose |
|-----------|------|---------|
| **UserSettings** | `UserSettings.tsx` | User account configuration |
| **PersonaManagement** | `PersonaManagement.tsx` | Writing style profiles |
| **PersonaCreationModal** | `PersonaCreationModal.tsx` | Style creation interface |

### ⚙️ Configuration & Settings
| Component | File | Purpose |
|-----------|------|---------|
| **APISettings** | `APISettings.tsx` | API key management |
| **CategorySelector** | `CategorySelector.tsx` | Content categorization |
| **TopicSelector** | `TopicSelector.tsx` | Topic selection interface |

### 🎨 UI Components
| Component | File | Purpose |
|-----------|------|---------|
| **PubHubLogo** | `PubHubLogo.tsx` | Application branding |

---

## 📖 Detailed Component Documentation

### 🏗️ Core Application Components

#### **App.tsx** - Main Application Container
```typescript
// Main routing and state management
- Handles authentication state
- Manages global application state
- Routes between different views
- Integrates with Supabase auth
```

#### **AuthWrapper.tsx** - Authentication Management
```typescript
// Authentication state provider
- User login/logout functionality
- Protected route management
- Session persistence
- Integration with Supabase Auth
```

### 📖 Book Creation System

#### **BookPrompt.tsx** - Book Creation Wizard
```typescript
interface BookPromptProps {
  onBookCreated: (book: Book) => void;
}

// Features:
- Genre and sub-genre selection
- Writing style configuration
- Target audience settings
- AI prompt generation
- Integration with writing personas
```

#### **BookEditor.tsx** - Main Editing Interface
```typescript
interface BookEditorProps {
  book: Book;
  onBookUpdated: (book: Book) => void;
}

// Features:
- Chapter management
- Content generation controls
- Real-time editing
- Progress tracking
- Export functionality
```

#### **ChapterView.tsx** - Chapter Management
```typescript
interface ChapterViewProps {
  chapter: BookChapter;
  onChapterUpdated: (chapter: BookChapter) => void;
}

// Features:
- Sub-chapter creation
- Content editing
- Status tracking
- AI content generation
```

#### **OutlineView.tsx** - Structure Overview
```typescript
interface OutlineViewProps {
  book: Book;
  onStructureChanged: (chapters: BookChapter[]) => void;
}

// Features:
- Drag-and-drop reordering
- Chapter addition/removal
- Structure visualization
- Bulk operations
```

### 🎓 Online Course Components

#### **OnlineCourseChapterView.tsx** - Course Module Management
```typescript
interface OnlineCourseChapterProps {
  chapter: BookChapter;
  onUpdate: (chapter: BookChapter) => void;
}

// Features:
- Lesson plan generation
- Blog article creation
- Featured image generation
- Text-to-speech integration
- Google Slides export (planned)
```

### 🎧 Multimedia Components

#### **AudiobookGenerator.tsx** - Text-to-Speech System
```typescript
interface AudiobookGeneratorProps {
  book: Book;
  onAudiobookGenerated: (audiobook: AudiobookData) => void;
}

// Features:
- Voice selection with recommendations
- Chapter-by-chapter processing
- Progress tracking
- Audio preview
- Export packaging
```

#### **AudioPlayer.tsx** - Audio Playback
```typescript
interface AudioPlayerProps {
  audioChapter: AudioChapter;
  onPlaybackComplete?: () => void;
}

// Features:
- Standard audio controls
- Chapter navigation
- Playback speed control
- Volume management
```

### 📝 WordPress Integration

#### **WordpressGenerator.tsx** - Article Automation
```typescript
interface WordpressGeneratorProps {
  site: WordPressSite;
  template: ArticleTemplate;
}

// Features:
- Automated article generation
- Category and tag management
- Featured image creation
- SEO optimization
- Publishing controls
```

#### **WordpressSettings.tsx** - Site Configuration
```typescript
interface WordpressSettingsProps {
  sites: WordPressSite[];
  onSitesUpdated: (sites: WordPressSite[]) => void;
}

// Features:
- Multi-site management
- Authentication setup
- Connection testing
- Configuration validation
```

#### **AutoPublishing.tsx** - Scheduling System
```typescript
interface AutoPublishingProps {
  schedules: PublicationSchedule[];
  onScheduleUpdated: (schedule: PublicationSchedule) => void;
}

// Features:
- Publication scheduling
- Template assignment
- Frequency configuration
- Status monitoring
```

### 👤 User Management Components

#### **PersonaManagement.tsx** - Writing Style Profiles
```typescript
interface PersonaManagementProps {
  personas: WritingPersona[];
  onPersonaUpdated: (persona: WritingPersona) => void;
}

// Features:
- Persona library management
- AI style analysis
- Export/import functionality
- Search and filtering
- Favorites management
```

#### **PersonaCreationModal.tsx** - Style Creation
```typescript
interface PersonaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaCreated: (persona: WritingPersona) => void;
}

// Features:
- Manual persona creation
- Writing sample analysis
- Style attribute configuration
- Genre specialization
```

### ⚙️ Configuration Components

#### **APISettings.tsx** - API Key Management
```typescript
interface APISettingsProps {
  settings: UserSettings;
  onSettingsUpdated: (settings: UserSettings) => void;
}

// Features:
- Secure API key storage
- Service configuration
- Connection testing
- Usage monitoring
```

#### **UserSettings.tsx** - User Configuration
```typescript
interface UserSettingsProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

// Features:
- Profile management
- Preference configuration
- API key management
- Account settings
```

---

## 🔗 Component Integration Patterns

### State Management
- **React Hooks**: useState, useEffect, useContext
- **Custom Hooks**: useAuth, useBook, usePersona
- **Global State**: Context providers for auth and settings

### Data Flow
- **Props Down**: Configuration and callback functions
- **Events Up**: User actions and state changes
- **Service Layer**: Business logic abstraction

### Error Handling
- **Boundary Components**: Error boundary wrappers
- **Try-Catch**: Service call error handling
- **User Feedback**: Toast notifications and error states

### Performance Optimization
- **React.memo**: Component memoization
- **useMemo/useCallback**: Hook optimization
- **Lazy Loading**: Dynamic imports for large components

---

## 🛠️ Development Guidelines

### Component Structure
```typescript
// Standard component template
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ 
  // Destructured props
}) => {
  // Hooks
  // Event handlers
  // Render logic
  
  return (
    // JSX with Tailwind classes
  );
};
```

### Styling Conventions
- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme-aware components
- **Accessibility**: ARIA labels and semantic HTML

### Testing Approach
- **Component Tests**: React Testing Library
- **Integration Tests**: Playwright
- **User Workflows**: End-to-end testing

---

## 📊 Component Dependencies

### External Libraries
- **React**: Core framework
- **Lucide React**: Icon system
- **React Quill**: Rich text editor
- **UUID**: Unique identifiers
- **File Saver**: Download functionality

### Internal Dependencies
- **Services**: Business logic layer
- **Types**: TypeScript definitions
- **Utils**: Helper functions
- **Lib**: Configuration utilities

---

*Last Updated: August 2025*