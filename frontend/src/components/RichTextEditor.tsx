import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  editable?: boolean
}

function convertPlainTextToHtml(text: string): string {
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'text-white'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
        boxShadow: '0 2px 6px rgba(29,211,176,0.3)',
      } : {}}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 mx-1" style={{ background: '#e5e7eb' }} />
}

export default function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: convertPlainTextToHtml(content),
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && !editor.isFocused) {
      const newContent = convertPlainTextToHtml(content)
      const currentContent = editor.getHTML()
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent)
      }
    }
  }, [content, editor])

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor])
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor])
  const toggleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor])
  const toggleH1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor])
  const toggleH2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor])
  const toggleH3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor])
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor])
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor])
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor])
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor])
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor])

  if (!editor) return null

  return (
    <div className="glass overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div
          className="flex items-center gap-0.5 px-3 py-2 flex-wrap"
          style={{ borderBottom: '1px solid rgba(29,211,176,0.15)' }}
        >
          <ToolbarButton onClick={toggleBold} active={editor.isActive('bold')} title="Bold">
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={toggleItalic} active={editor.isActive('italic')} title="Italic">
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={toggleUnderline} active={editor.isActive('underline')} title="Underline">
            <UnderlineIcon size={15} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton onClick={toggleH1} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={toggleH2} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={toggleH3} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 size={15} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton onClick={toggleBulletList} active={editor.isActive('bulletList')} title="Bullet List">
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={toggleOrderedList} active={editor.isActive('orderedList')} title="Ordered List">
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={toggleBlockquote} active={editor.isActive('blockquote')} title="Blockquote">
            <Quote size={15} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton onClick={undo} disabled={!editor.can().undo()} title="Undo">
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={redo} disabled={!editor.can().redo()} title="Redo">
            <Redo size={15} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="rich-text-editor-content"
      />

      <style>{`
        .rich-text-editor-content .tiptap {
          min-height: 400px;
          padding: 1.25rem 1.5rem;
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.7;
          color: #1f2937;
          outline: none;
        }
        .rich-text-editor-content .tiptap p {
          margin-bottom: 0.75rem;
        }
        .rich-text-editor-content .tiptap h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #0a0a0a;
          font-family: var(--font-display);
        }
        .rich-text-editor-content .tiptap h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #0a0a0a;
          font-family: var(--font-display);
        }
        .rich-text-editor-content .tiptap h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #111827;
          font-family: var(--font-display);
        }
        .rich-text-editor-content .tiptap ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .rich-text-editor-content .tiptap ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .rich-text-editor-content .tiptap li {
          margin-bottom: 0.25rem;
        }
        .rich-text-editor-content .tiptap blockquote {
          border-left: 3px solid #1dd3b0;
          padding-left: 1rem;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 0.75rem;
        }
        .rich-text-editor-content .tiptap strong {
          font-weight: 600;
        }
        .rich-text-editor-content .tiptap em {
          font-style: italic;
        }
        .rich-text-editor-content .tiptap u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
