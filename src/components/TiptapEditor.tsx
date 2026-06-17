import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditorReady?: (editor: Editor) => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, onEditorReady }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Begin writing your masterpiece, or use the assistant to generate text...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none',
        style: 'min-height: 100%;',
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update content if it changes externally (e.g. initial load)
  // But be careful not to overwrite streaming text
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      // Only set content if we are not currently streaming or user typing
      // For this simplified version, we just let the parent control initial content.
      // If we use insertContent during SSE, it updates the editor without triggering this.
    }
  }, [content, editor]);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <EditorContent editor={editor} style={{ height: '100%' }} />
    </div>
  );
};
