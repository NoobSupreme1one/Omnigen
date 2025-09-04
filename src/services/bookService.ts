import { Book, BookChapter, SubChapter } from '../types';

const BOOKS_STORAGE_KEY = 'omnigen_books';

// Local storage implementation for books
export const saveBook = async (book: Book): Promise<Book> => {
  try {
    const existingBooks = await loadAllBooks();
    const bookIndex = existingBooks.findIndex(b => b.id === book.id);
    
    const bookToSave = {
      ...book,
      updatedAt: new Date().toISOString()
    };

    let updatedBooks;
    if (bookIndex >= 0) {
      updatedBooks = [...existingBooks];
      updatedBooks[bookIndex] = bookToSave;
    } else {
      updatedBooks = [bookToSave, ...existingBooks];
    }

    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
    return bookToSave;
  } catch (error) {
    console.error('Error saving book:', error);
    throw error;
  }
};

export const loadBook = async (bookId: string): Promise<Book | null> => {
  try {
    const books = await loadAllBooks();
    return books.find(book => book.id === bookId) || null;
  } catch (error) {
    console.error('Error loading book:', error);
    return null;
  }
};

export const loadAllBooks = async (): Promise<Book[]> => {
  try {
    const booksJson = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!booksJson) return [];
    
    const books = JSON.parse(booksJson);
    return Array.isArray(books) ? books : [];
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

export const deleteBook = async (bookId: string): Promise<void> => {
  try {
    const books = await loadAllBooks();
    const updatedBooks = books.filter(book => book.id !== bookId);
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};