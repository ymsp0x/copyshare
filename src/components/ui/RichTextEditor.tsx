import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string, delta: any, source: string, editor: any) => void;
  onBlur?: (previousSelection: any, source: string, editor: any) => void;
  onFocus?: (selection: any, source: string, editor: any) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(
  ({ value, onChange, onBlur, onFocus, placeholder, className, minHeight = '180px' }, ref) => {

    const quillModules = {
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'align': [] }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
    };

    const quillFormats = [
      'header', 'font', 'size', 'align', 'indent', 'list', 'bullet', 'script',
      'bold', 'italic', 'underline', 'strike', 'color', 'background',
      'link', 'image', 'video', 'blockquote', 'code-block', 'clean'
    ];

    return (
      <div style={{ minHeight: minHeight }}>
        <ReactQuill
          ref={ref}
          theme="snow"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          modules={quillModules}
          formats={quillFormats}
          placeholder={placeholder}
          className={`h-full bg-white dark:bg-neutral-900 ${className || ''}`}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;