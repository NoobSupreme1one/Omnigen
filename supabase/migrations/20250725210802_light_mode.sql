/*
  # Create books database schema

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `genre` (text)
      - `sub_genre` (text)
      - `tone` (text)
      - `heat_level` (text)
      - `perspective` (text)
      - `target_audience` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chapters`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sub_chapters`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, references chapters)
      - `title` (text)
      - `description` (text)
      - `content` (text)
      - `status` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own books
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  genre text,
  sub_genre text,
  tone text,
  heat_level text,
  perspective text,
  target_audience text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sub_chapters table
CREATE TABLE IF NOT EXISTS sub_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text,
  status text DEFAULT 'pending',
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_chapters ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Users can read own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chapters policies
CREATE POLICY "Users can read chapters of own books"
  ON chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chapters to own books"
  ON chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chapters of own books"
  ON chapters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chapters of own books"
  ON chapters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

-- Sub-chapters policies
CREATE POLICY "Users can read sub-chapters of own books"
  ON sub_chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sub-chapters to own books"
  ON sub_chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sub-chapters of own books"
  ON sub_chapters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sub-chapters of own books"
  ON sub_chapters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(book_id, order_index);
CREATE INDEX IF NOT EXISTS idx_sub_chapters_chapter_id ON sub_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sub_chapters_order ON sub_chapters(chapter_id, order_index);