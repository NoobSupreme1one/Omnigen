import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ArticleEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ content, onContentChange }) => {
  return (
    <ReactQuill
      theme="snow"
      value={content}
      onChange={onContentChange}
    />
  );
};

export default ArticleEditor;
