import { supabase } from '../lib/supabase';
import { Book, BookChapter, SubChapter } from '../types';

export interface DatabaseBook {
  id: string;
  title: string;
  description: string;
  genre: string;
  sub_genre?: string;
  tone: string;
  heat_level?: string;
  perspective?: string;
  target_audience?: string;
  status: string;
  created_at: string;
  updated_at: string;
  chapters?: DatabaseChapter[];
}

export interface DatabaseChapter {
  id: string;
  book_id: string;
  title: string;
  description: string;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  sub_chapters?: DatabaseSubChapter[];
}

export interface DatabaseSubChapter {
  id: string;
  chapter_id: string;
  title: string;
  description: string;
  content?: string;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Convert database format to app format
const convertDatabaseBookToBook = (dbBook: DatabaseBook): Book => {
  return {
    id: dbBook.id,
    title: dbBook.title,
    description: dbBook.description || '',
    genre: dbBook.genre,
    subGenre: dbBook.sub_genre,
    tone: dbBook.tone,
    heatLevel: dbBook.heat_level,
    perspective: dbBook.perspective,
    targetAudience: dbBook.target_audience,
    status: dbBook.status as 'draft' | 'generating' | 'completed',
    chapters: dbBook.chapters?.map((chapter, index) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description || '',
      status: chapter.status as 'pending' | 'generating' | 'completed',
      expanded: false,
      subChapters: chapter.sub_chapters?.map((subChapter) => ({
        id: subChapter.id,
        title: subChapter.title,
        description: subChapter.description || '',
        content: subChapter.content,
        status: subChapter.status as 'pending' | 'generating' | 'completed'
      }))
    })) || []
  };
};

export const saveBook = async (book: Book): Promise<Book> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Save or update book
  const bookData = {
    id: book.id,
    user_id: user.id,
    title: book.title,
    description: book.description,
    genre: book.genre,
    sub_genre: book.subGenre,
    tone: book.tone,
    heat_level: book.heatLevel,
    perspective: book.perspective,
    target_audience: book.targetAudience,
    status: book.status,
    updated_at: new Date().toISOString()
  };

  const { error: bookError } = await supabase
    .from('books')
    .upsert(bookData);

  if (bookError) throw bookError;

  // Save chapters
  for (let i = 0; i < book.chapters.length; i++) {
    const chapter = book.chapters[i];
    const chapterData = {
      id: chapter.id,
      book_id: book.id,
      title: chapter.title,
      description: chapter.description,
      status: chapter.status,
      order_index: i,
      updated_at: new Date().toISOString()
    };

    const { error: chapterError } = await supabase
      .from('chapters')
      .upsert(chapterData);

    if (chapterError) throw chapterError;

    // Save sub-chapters
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        const subChapterData = {
          id: subChapter.id,
          chapter_id: chapter.id,
          title: subChapter.title,
          description: subChapter.description,
          content: subChapter.content,
          status: subChapter.status,
          order_index: j,
          updated_at: new Date().toISOString()
        };

        const { error: subChapterError } = await supabase
          .from('sub_chapters')
          .upsert(subChapterData);

        if (subChapterError) throw subChapterError;
      }
    }
  }

  return book;
};

export const loadBook = async (bookId: string): Promise<Book | null> => {
  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .select(`
      *,
      chapters (
        *,
        sub_chapters (*)
      )
    `)
    .eq('id', bookId)
    .single();

  if (bookError) {
    if (bookError.code === 'PGRST116') return null;
    throw bookError;
  }

  // Sort chapters and sub-chapters by order_index
  if (bookData.chapters) {
    bookData.chapters.sort((a: any, b: any) => a.order_index - b.order_index);
    bookData.chapters.forEach((chapter: any) => {
      if (chapter.sub_chapters) {
        chapter.sub_chapters.sort((a: any, b: any) => a.order_index - b.order_index);
      }
    });
  }

  return convertDatabaseBookToBook(bookData as DatabaseBook);
};

export const loadAllBooks = async (): Promise<Book[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: booksData, error } = await supabase
    .from('books')
    .select(`
      *,
      chapters (
        *,
        sub_chapters (*)
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return booksData.map((bookData: any) => {
    // Sort chapters and sub-chapters by order_index
    if (bookData.chapters) {
      bookData.chapters.sort((a: any, b: any) => a.order_index - b.order_index);
      bookData.chapters.forEach((chapter: any) => {
        if (chapter.sub_chapters) {
          chapter.sub_chapters.sort((a: any, b: any) => a.order_index - b.order_index);
        }
      });
    }
    return convertDatabaseBookToBook(bookData as DatabaseBook);
  });
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (error) throw error;
};