// Rich-text editor (TipTap, MIT) for document text such as the quotation
// terms page: formatting, lists, alignment, tables and a "bank details" block
// that prints as the company's bank table.
import { useEffect } from 'react';
import { EditorContent, Node, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Columns3, Heading2, Heading3, Italic,
  Landmark, List, ListOrdered, Minus, Redo2, Rows3, Table2, Trash2, Underline as UnderlineIcon, Undo2,
} from 'lucide-react';
import { BANK_MARKER_ATTR } from './richText';
import '../../styles/RichTextEditor.css';

// Placeholder block replaced by the bank details table when printed
const BankDetails = Node.create({
  name: 'bankDetails',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML() {
    return [{ tag: `div[${BANK_MARKER_ATTR}]` }];
  },
  renderHTML() {
    return ['div', { [BANK_MARKER_ATTR]: 'true', class: 'rte-bank' }];
  },
});

function Btn({ label, icon, active, disabled, onClick }) {
  const Icon = icon;
  return (
    <button
      type="button"
      className={`rte-btn ${active ? 'is-on' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={active ? 'true' : undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

function RichTextEditor({ value, onChange, label, minHeight = 260 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      BankDetails,
    ],
    content: value || '<p></p>',
    editorProps: { attributes: { class: 'rte-content', 'aria-label': label || 'Text editor', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  // Follow outside changes (e.g. "reset to default")
  useEffect(() => {
    if (editor && value != null && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  if (!editor) return null;
  const chain = () => editor.chain().focus();
  const inTable = editor.isActive('table');

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        <Btn label="Bold" icon={Bold} active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()} />
        <Btn label="Italic" icon={Italic} active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()} />
        <Btn label="Underline" icon={UnderlineIcon} active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()} />
        <span className="rte-sep" />
        <Btn label="Heading" icon={Heading2} active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
        <Btn label="Sub-heading" icon={Heading3} active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
        <Btn label="Numbered list" icon={ListOrdered} active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()} />
        <Btn label="Bullet list" icon={List} active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()} />
        <span className="rte-sep" />
        <Btn label="Align left" icon={AlignLeft} active={editor.isActive({ textAlign: 'left' })} onClick={() => chain().setTextAlign('left').run()} />
        <Btn label="Centre" icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} onClick={() => chain().setTextAlign('center').run()} />
        <Btn label="Align right" icon={AlignRight} active={editor.isActive({ textAlign: 'right' })} onClick={() => chain().setTextAlign('right').run()} />
        <Btn label="Justify" icon={AlignJustify} active={editor.isActive({ textAlign: 'justify' })} onClick={() => chain().setTextAlign('justify').run()} />
        <span className="rte-sep" />
        <Btn label="Insert table" icon={Table2} onClick={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: false }).run()} />
        {inTable && (
          <>
            <Btn label="Add row" icon={Rows3} onClick={() => chain().addRowAfter().run()} />
            <Btn label="Add column" icon={Columns3} onClick={() => chain().addColumnAfter().run()} />
            <Btn label="Delete row" icon={Minus} onClick={() => chain().deleteRow().run()} />
            <Btn label="Delete table" icon={Trash2} onClick={() => chain().deleteTable().run()} />
          </>
        )}
        <Btn label="Line" icon={Minus} onClick={() => chain().setHorizontalRule().run()} />
        <span className="rte-sep" />
        <button
          type="button"
          className="rte-btn rte-btn-text"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => chain().insertContent({ type: 'bankDetails' }).run()}
        >
          <Landmark size={15} aria-hidden="true" /> Bank details
        </button>
        <span className="rte-spacer" />
        <Btn label="Undo" icon={Undo2} disabled={!editor.can().undo()} onClick={() => chain().undo().run()} />
        <Btn label="Redo" icon={Redo2} disabled={!editor.can().redo()} onClick={() => chain().redo().run()} />
      </div>
      <EditorContent editor={editor} className="rte-scroll" style={{ minHeight }} />
    </div>
  );
}

export default RichTextEditor;
