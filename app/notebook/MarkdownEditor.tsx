"use client";

import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin, 
  toolbarPlugin, 
  UndoRedo, 
  BoldItalicUnderlineToggles, 
  BlockTypeSelect 
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
}

export default function MarkdownEditor({ markdown, onChange, disabled }: MarkdownEditorProps) {
  return (
    <div className={`mdx-editor-wrapper ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <MDXEditor
        markdown={markdown}
        onChange={onChange}
        readOnly={disabled}
        contentEditableClassName="markdown-body p-4 min-h-[200px] bg-white dark:bg-[#1A1814] focus:outline-none"
        className="border border-[#E8C55A]/50 rounded-lg overflow-hidden flex flex-col focus-within:border-[#b58c14] transition-colors"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex items-center gap-2 p-2 bg-[#fef7e6] dark:bg-black/40 border-b border-[#E8C55A]/30 w-full overflow-x-auto">
                <UndoRedo />
                <div className="w-px h-5 bg-[#E8C55A]/30 mx-1"></div>
                <BoldItalicUnderlineToggles />
                <div className="w-px h-5 bg-[#E8C55A]/30 mx-1"></div>
                <BlockTypeSelect />
              </div>
            )
          })
        ]}
      />
    </div>
  );
}
