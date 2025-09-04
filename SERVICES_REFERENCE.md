# ⚙️ Omnigen - Services Reference Guide

> Complete reference for all service modules in the Omnigen platform

## 📋 Service Categories

### 🤖 AI & Content Generation
| Service | File | Purpose |
|---------|------|---------|
| **Gemini Service** | `geminiService.ts` | Google Gemini AI integration |
| **OpenRouter Service** | `openRouterService.ts` | Multi-model AI router |
| **Vertex Service** | `vertexService.ts` | Google Vertex AI integration |
| **Perplexity Service** | `perplexityService.ts` | Research AI integration |
| **Content Service** | `contentService.ts` | Content generation orchestration |
| **Editing Service** | `editingService.ts` | Content editing workflows |

### 📝 WordPress & Publishing
| Service | File | Purpose |
|---------|------|---------|
| **WordPress Service** | `wordpressService.ts` | WordPress API integration |
| **WordPress Debug Service** | `wordpressDebugService.ts` | Debug & troubleshooting |
| **Article Generation Service** | `articleGenerationService.ts` | Article automation |
| **Auto Publishing Service** | `autoPublishingService.ts` | Automated publishing |
| **Auto Publishing Scheduler** | `autoPublishingScheduler.ts` | Scheduling system |
| **Scheduling Service** | `schedulingService.ts` | Publication timing |

### 👤 User & Content Management
| Service | File | Purpose |
|---------|------|---------|
| **User Service** | `userService.ts` | User account management |
| **User Settings Service** | `userSettingsService.ts` | User preferences |
| **Book Service** | `bookService.ts` | Book data management |
| **Persona Service** | `personaService.ts` | Writing persona system |
| **Blog Analysis Service** | `blogAnalysisService.ts` | Content analytics |

### 🎧 Multimedia & Export
| Service | File | Purpose |
|---------|------|---------|
| **TTS Service** | `ttsService.ts` | Text-to-speech conversion |
| **Cover Service** | `coverService.ts` | Book cover generation |
| **Export Service** | `exportService.ts` | Multi-format export |
| **Online Course Service** | `onlineCourseService.ts` | Course creation |

### 🔧 System & Infrastructure
| Service | File | Purpose |
|---------|------|---------|
| **Automation Controller** | `automationController.ts` | Workflow automation |
| **Automation Logger** | `automationLogger.ts` | Activity logging |

---

## 🤖 AI & Content Generation Services

### **geminiService.ts** - Google Gemini AI Integration
```typescript
// Core AI content generation service
class GeminiService {
  // Book content generation
  generateBookOutline(prompt: string, options: BookOptions): Promise<BookChapter[]>
  generateChapterContent(chapter: BookChapter, context: BookContext): Promise<string>
  
  // Article generation
  generateArticle(topic: string, template: ArticleTemplate): Promise<string>
  generateTitle(content: string): Promise<string>
  
  // Persona analysis
  analyzeWritingStyle(sampleText: string): Promise<PersonaAnalysis>
  generateWithPersona(prompt: string, persona: WritingPersona): Promise<string>
}

// Key Features:
- Multi-format content generation
- Writing style adaptation
- Context-aware generation
- Error handling and retries
- Token usage optimization
```

### **openRouterService.ts** - Multi-Model AI Router
```typescript
// Alternative AI model access
class OpenRouterService {
  // Model selection and routing
  generateContent(prompt: string, model: string): Promise<string>
  listAvailableModels(): Promise<ModelInfo[]>
  
  // Cost optimization
  selectOptimalModel(contentType: string, budget: number): Promise<string>
  estimateCost(prompt: string, model: string): Promise<number>
}

// Supported Models:
- GPT-4 variants
- Claude models
- Open source alternatives
- Cost-optimized routing
```

### **contentService.ts** - Content Generation Orchestration
```typescript
// High-level content generation coordination
class ContentService {
  // Book generation workflow
  generateCompleteBook(prompt: BookPrompt): Promise<Book>
  generateChapterWithSubchapters(chapter: BookChapter): Promise<BookChapter>
  
  // Quality control
  validateContent(content: string, criteria: QualityCriteria): Promise<boolean>
  improveContent(content: string, feedback: string): Promise<string>
  
  // Batch operations
  generateMultipleChapters(chapters: BookChapter[]): Promise<BookChapter[]>
}
```

---

## 📝 WordPress & Publishing Services

### **wordpressService.ts** - WordPress API Integration
```typescript
// WordPress REST API integration
class WordPressService {
  // Site management
  testConnection(site: WordPressSite): Promise<boolean>
  getSiteInfo(site: WordPressSite): Promise<SiteInfo>
  
  // Content publishing
  createPost(site: WordPressSite, post: PostData): Promise<number>
  updatePost(site: WordPressSite, postId: number, post: PostData): Promise<boolean>
  deletePost(site: WordPressSite, postId: number): Promise<boolean>
  
  // Media management
  uploadImage(site: WordPressSite, image: File): Promise<MediaItem>
  setFeaturedImage(site: WordPressSite, postId: number, mediaId: number): Promise<boolean>
  
  // Taxonomy management
  getCategories(site: WordPressSite): Promise<Category[]>
  createCategory(site: WordPressSite, category: CategoryData): Promise<number>
  getTags(site: WordPressSite): Promise<Tag[]>
}

// Authentication:
- Application password support
- Secure credential storage
- Connection validation
- Multi-site management
```

### **autoPublishingService.ts** - Automated Publishing
```typescript
// Automated content publishing workflow
class AutoPublishingService {
  // Article generation and publishing
  generateAndPublishArticle(schedule: PublicationSchedule): Promise<PublishedArticle>
  
  // Batch processing
  processScheduledArticles(date: Date): Promise<ProcessResult[]>
  
  // Error handling
  retryFailedPublications(): Promise<RetryResult[]>
  handlePublishingError(error: PublishingError): Promise<void>
  
  // Status monitoring
  getPublishingStatus(scheduleId: string): Promise<PublishingStatus>
  getPublishingHistory(siteId: string, limit: number): Promise<PublishedArticle[]>
}

// Features:
- Scheduled content generation
- Multi-site publishing
- Error recovery
- Performance monitoring
```

### **articleGenerationService.ts** - Article Creation Automation
```typescript
// Specialized article generation
class ArticleGenerationService {
  // Template-based generation
  generateFromTemplate(template: ArticleTemplate, variables: TemplateVariables): Promise<string>
  
  // SEO optimization
  optimizeForSEO(content: string, keywords: string[]): Promise<OptimizedContent>
  generateMetaDescription(content: string): Promise<string>
  
  // Content enhancement
  addFeaturedImage(article: string, imagePrompt: string): Promise<string>
  formatForWordPress(content: string): Promise<string>
}
```

---

## 👤 User & Content Management Services

### **userService.ts** - User Account Management
```typescript
// User account and profile management
class UserService {
  // Profile management
  getUserProfile(userId: string): Promise<UserProfile>
  updateUserProfile(userId: string, profile: UserProfile): Promise<boolean>
  
  // Settings management
  getUserSettings(userId: string): Promise<UserSettings>
  updateUserSettings(userId: string, settings: UserSettings): Promise<boolean>
  
  // API key management
  storeAPIKeys(userId: string, keys: APIKeys): Promise<boolean>
  validateAPIKeys(keys: APIKeys): Promise<ValidationResult>
  
  // Usage tracking
  recordUsage(userId: string, usage: UsageRecord): Promise<void>
  getUserUsage(userId: string, period: TimePeriod): Promise<UsageStats>
}
```

### **bookService.ts** - Book Data Management
```typescript
// Book creation and management
class BookService {
  // CRUD operations
  createBook(book: BookData): Promise<string>
  getBook(bookId: string): Promise<Book>
  updateBook(bookId: string, updates: Partial<Book>): Promise<boolean>
  deleteBook(bookId: string): Promise<boolean>
  
  // Chapter management
  addChapter(bookId: string, chapter: BookChapter): Promise<string>
  updateChapter(chapterId: string, content: string): Promise<boolean>
  reorderChapters(bookId: string, chapterOrder: string[]): Promise<boolean>
  
  // Progress tracking
  updateGenerationStatus(itemId: string, status: GenerationStatus): Promise<void>
  getBookProgress(bookId: string): Promise<ProgressInfo>
  
  // Export operations
  exportBook(bookId: string, format: ExportFormat): Promise<ExportResult>
}
```

### **personaService.ts** - Writing Persona System
```typescript
// Writing persona management and analysis
class PersonaService {
  // Persona CRUD
  createPersona(persona: PersonaData): Promise<string>
  getPersona(personaId: string): Promise<WritingPersona>
  updatePersona(personaId: string, updates: Partial<WritingPersona>): Promise<boolean>
  deletePersona(personaId: string): Promise<boolean>
  
  // AI analysis
  analyzeWritingSample(text: string): Promise<PersonaAnalysis>
  extractStyleCharacteristics(text: string): Promise<StyleCharacteristics>
  
  // Application and management
  applyPersonaToContent(content: string, persona: WritingPersona): Promise<string>
  findSimilarPersonas(persona: WritingPersona): Promise<WritingPersona[]>
  
  // Import/export
  exportPersona(personaId: string): Promise<PersonaExport>
  importPersona(personaData: PersonaExport): Promise<string>
}
```

---

## 🎧 Multimedia & Export Services

### **ttsService.ts** - Text-to-Speech Conversion
```typescript
// Text-to-speech and audio generation
class TTSService {
  // Voice management
  getAvailableVoices(): Promise<VoiceOption[]>
  recommendVoice(content: string, genre: string): Promise<VoiceOption>
  
  // Audio generation
  generateAudio(text: string, voice: VoiceOption): Promise<AudioBlob>
  generateChapterAudio(chapter: BookChapter, voice: VoiceOption): Promise<AudioChapter>
  
  // Batch processing
  generateBookAudiobook(book: Book, voice: VoiceOption): Promise<AudiobookData>
  
  // Audio management
  combineAudioChapters(chapters: AudioChapter[]): Promise<AudioBlob>
  generatePlaylist(audiobook: AudiobookData): Promise<PlaylistData>
}

// Features:
- Multi-voice support
- SSML integration
- Audio optimization
- Playlist generation
```

### **exportService.ts** - Multi-Format Export
```typescript
// Content export in multiple formats
class ExportService {
  // PDF generation
  generatePDF(book: Book, options: PDFOptions): Promise<Blob>
  
  // EPUB creation
  generateEPUB(book: Book, options: EPUBOptions): Promise<Blob>
  
  // Audiobook packaging
  packageAudiobook(audiobook: AudiobookData): Promise<Blob>
  
  // Course exports
  generateCoursePackage(course: OnlineCourse): Promise<Blob>
  exportToGoogleSlides(lessonPlan: LessonPlan): Promise<string> // URL
  
  // Metadata generation
  generateMetadata(book: Book): Promise<BookMetadata>
  createTableOfContents(book: Book): Promise<TOCData>
}
```

### **coverService.ts** - Book Cover Generation
```typescript
// AI-powered cover generation
class CoverService {
  // Cover generation
  generateCover(book: Book, style: CoverStyle): Promise<CoverImage>
  generateMultipleCovers(book: Book, count: number): Promise<CoverImage[]>
  
  // Style management
  analyzeCoverTrends(genre: string): Promise<CoverTrends>
  suggestCoverStyles(book: Book): Promise<CoverStyle[]>
  
  // Image processing
  resizeCover(image: CoverImage, dimensions: Dimensions): Promise<CoverImage>
  addTextToCover(image: CoverImage, text: CoverText): Promise<CoverImage>
}
```

---

## 🔧 System & Infrastructure Services

### **automationController.ts** - Workflow Automation
```typescript
// Centralized automation control
class AutomationController {
  // Workflow management
  createWorkflow(workflow: WorkflowDefinition): Promise<string>
  executeWorkflow(workflowId: string, inputs: WorkflowInputs): Promise<WorkflowResult>
  
  // Scheduling
  scheduleWorkflow(workflowId: string, schedule: ScheduleConfig): Promise<string>
  pauseWorkflow(workflowId: string): Promise<boolean>
  resumeWorkflow(workflowId: string): Promise<boolean>
  
  // Monitoring
  getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>
  getWorkflowHistory(workflowId: string): Promise<WorkflowExecution[]>
  
  // Error handling
  retryFailedWorkflow(executionId: string): Promise<WorkflowResult>
  handleWorkflowError(error: WorkflowError): Promise<void>
}
```

### **automationLogger.ts** - Activity Logging
```typescript
// Comprehensive logging and monitoring
class AutomationLogger {
  // Event logging
  logEvent(event: AutomationEvent): Promise<void>
  logError(error: AutomationError): Promise<void>
  logWorkflowExecution(execution: WorkflowExecution): Promise<void>
  
  // Query and analysis
  getEventHistory(filter: EventFilter): Promise<AutomationEvent[]>
  getErrorReport(timeframe: TimeFrame): Promise<ErrorReport>
  getUsageStatistics(period: TimePeriod): Promise<UsageStatistics>
  
  // Alerting
  createAlert(condition: AlertCondition): Promise<string>
  checkAlerts(): Promise<Alert[]>
  sendNotification(notification: NotificationData): Promise<boolean>
}
```

---

## 🔗 Service Integration Patterns

### Dependency Injection
```typescript
// Services use dependency injection for testability
class ServiceContainer {
  private services: Map<string, any> = new Map();
  
  register<T>(name: string, instance: T): void
  resolve<T>(name: string): T
  createScope(): ServiceScope
}
```

### Error Handling
```typescript
// Standardized error handling across services
interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

class ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  
  static ok<T>(data: T): ServiceResult<T>
  static error<T>(error: ServiceError): ServiceResult<T>
}
```

### Configuration Management
```typescript
// Environment-based configuration
interface ServiceConfig {
  apiEndpoints: Record<string, string>;
  timeout: number;
  retryAttempts: number;
  rateLimits: Record<string, number>;
}

class ConfigManager {
  getConfig<T>(service: string): T
  updateConfig<T>(service: string, config: Partial<T>): Promise<void>
}
```

### Performance Monitoring
```typescript
// Service performance tracking
class PerformanceMonitor {
  startTimer(operation: string): Timer
  recordMetric(metric: string, value: number): void
  getMetrics(service: string): Promise<ServiceMetrics>
}
```

---

## 🛡️ Security & Best Practices

### API Key Management
- Secure storage in environment variables
- Rotation and validation
- Usage monitoring and limits
- Encryption at rest

### Rate Limiting
- Service-specific rate limits
- Exponential backoff
- Queue management
- Priority-based processing

### Data Validation
- Input sanitization
- Schema validation
- Type checking
- SQL injection prevention

### Error Recovery
- Circuit breaker pattern
- Retry mechanisms
- Fallback strategies
- Graceful degradation

---

*Last Updated: August 2025*