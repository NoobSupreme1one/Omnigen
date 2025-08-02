# Unstack UI/UX Implementation Plan

## Phase 1: High Priority Improvements

### 1. Enhanced Tailwind Configuration

First, let's extend the Tailwind configuration to include a proper design system:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 2. Enhanced Form Components

Create reusable form components with better accessibility and visual design:

```typescript
// src/components/ui/FormField.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autocomplete?: string;
  options?: { value: string; label: string }[];
  className?: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  autocomplete,
  options = [],
  className,
  helperText,
}) => {
  const id = `field-${name}`;
  const hasError = !!error;

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autocomplete}
            required={required}
            rows={4}
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
              'transition-all duration-200',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
            )}
            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          />
        ) : type === 'select' ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
              'transition-all duration-200',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
            )}
            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autocomplete}
            required={required}
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
              'transition-all duration-200',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
            )}
            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          />
        )}
      </div>

      {helperText && !hasError && (
        <p id={`${id}-helper`} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {hasError && (
        <p id={`${id}-error`} className="text-sm text-error-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
```

### 3. Enhanced Button Component

```typescript
// src/components/ui/Button.tsx
import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className,
  icon,
  fullWidth = false,
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    fullWidth && 'w-full',
    className
  );

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-soft',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
};
```

### 4. Toast Notification System

```typescript
// src/components/ui/Toast.tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <AlertCircle className="w-5 h-5 text-error-500" />,
    info: <Info className="w-5 h-5 text-primary-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
  };

  const colors = {
    success: 'border-success-200 bg-success-50',
    error: 'border-error-200 bg-error-50',
    info: 'border-primary-200 bg-primary-50',
    warning: 'border-warning-200 bg-warning-50',
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn(
        'rounded-lg border p-4 shadow-soft',
        colors[type]
      )}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-sm text-gray-600">
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Manager
interface ToastManagerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
  }>;
  onClose: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};
```

### 5. Enhanced Navigation Component

```typescript
// src/components/ui/Navigation.tsx
import React from 'react';
import { cn } from '../../utils/cn';
import { BookOpen, FileText, User } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface NavigationProps {
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeItem,
  onItemClick,
  className,
}) => {
  return (
    <nav className={cn('flex space-x-1', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            activeItem === item.id
              ? 'bg-primary-600 text-white shadow-medium focus:ring-primary-500'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-500'
          )}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.count !== undefined && (
            <span className={cn(
              'ml-auto px-2 py-1 text-xs font-medium rounded-full',
              activeItem === item.id
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            )}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
```

### 6. Loading States and Skeleton Components

```typescript
// src/components/ui/Skeleton.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  );
};

// Form Skeleton
export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" variant="text" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" variant="text" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-12 w-32" />
    </div>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 animate-fade-in">
      <Skeleton className="h-6 w-3/4" variant="text" />
      <Skeleton className="h-4 w-full" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
};
```

### 7. Updated App Component with Enhanced UI

```typescript
// src/App.tsx (updated with new components)
import React, { useState } from 'react';
import { useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import AuthWrapper from './components/AuthWrapper';
import { supabase } from './lib/supabase';
import BookSidebar from './components/BookSidebar';
import BookPrompt from './components/BookPrompt';
import OutlineView from './components/OutlineView';
import ChapterView from './components/ChapterView';
import OnlineCourseChapterView from './components/OnlineCourseChapterView';
import BookEditor from './components/BookEditor';
import PersonaManagement from './components/PersonaManagement';
import WordpressGenerator from './components/WordpressGenerator';
import WordpressSettings from './components/WordpressSettings';
import { Navigation } from './components/ui/Navigation';
import { ToastManager } from './components/ui/Toast';
import { Book, BookChapter, WritingPersona } from './types';
import { saveBook, loadBook } from './services/bookService';
import { getWordpressCredentials } from './services/wordpressService';

function App() {
  const [currentView, setCurrentView] = useState<'books' | 'articles' | 'personas'>('books');
  const [currentStep, setCurrentStep] = useState<'prompt' | 'outline' | 'chapter' | 'edit' | 'personas'>('prompt');
  const [book, setBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<BookChapter | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<WritingPersona | null>(null);
  const [wordpressConnected, setWordpressConnected] = useState(false);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
  }>>([]);

  const navigationItems = [
    {
      id: 'books',
      label: 'Books',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'articles',
      label: 'Articles',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'personas',
      label: 'Writing Personas',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ... existing useEffect and handler functions ...

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <BookSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectBook={handleSelectBook}
          onNewBook={handleNewBookFromSidebar}
          currentBookId={book?.id}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-soft border-b border-gray-200 px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Left side - Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>

                <Navigation
                  items={navigationItems}
                  activeItem={currentView}
                  onItemClick={(itemId) => setCurrentView(itemId as any)}
                />
              </div>

              {/* Right side - User menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep('settings' as any)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {currentView === 'books' && (
                <>
                  {currentStep === 'prompt' && <BookPrompt onGenerate={handleGenerate} />}
                  {currentStep === 'outline' && book && (
                    <OutlineView 
                      book={book}
                      onChapterClick={handleChapterClick}
                      onNewBook={handleNewBook}
                      onUpdateBook={(updatedBook) => {
                        setBook(updatedBook);
                        saveBookToDatabase(updatedBook);
                      }}
                      apiKeys={apiKeys}
                    />
                  )}
                  {renderChapterView()}
                  {currentStep === 'edit' && book && (
                    <BookEditor
                      book={book}
                      onBack={handleBackFromEdit}
                      onUpdateBook={(updatedBook) => {
                        setBook(updatedBook);
                        saveBookToDatabase(updatedBook);
                      }}
                      apiKeys={apiKeys}
                    />
                  )}
                </>
              )}

              {currentView === 'articles' && (
                <>
                  {wordpressConnected ? (
                    <WordpressGenerator 
                      apiKeys={apiKeys} 
                      persona={selectedPersona} 
                    />
                  ) : (
                    <WordpressSettings onConnect={() => setWordpressConnected(true)} />
                  )}
                </>
              )}

              {currentView === 'personas' && (
                <PersonaManagement
                  apiKeys={apiKeys}
                  onPersonaSelect={setSelectedPersona}
                  selectedPersonaId={selectedPersona?.id}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastManager toasts={toasts} onClose={removeToast} />
    </AuthWrapper>
  );
}

export default App;
```

### 8. Utility Functions

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Implementation Steps

1. **Install Dependencies:**
```bash
npm install @tailwindcss/forms @tailwindcss/typography clsx tailwind-merge
```

2. **Update Tailwind Config:**
Replace the existing `tailwind.config.js` with the enhanced version above.

3. **Create UI Components:**
Create the component files as shown above in `src/components/ui/`.

4. **Update Existing Components:**
Gradually replace existing form elements and buttons with the new UI components.

5. **Add Toast System:**
Integrate the toast notification system for better user feedback.

6. **Test Accessibility:**
Use browser dev tools and screen readers to test accessibility improvements.

This implementation plan provides a solid foundation for modern, accessible, and user-friendly UI components that can be gradually integrated into the existing application. 