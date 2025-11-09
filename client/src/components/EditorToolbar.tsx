import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { Button } from './ui/button';

const EditorToolbar = () => {
  const [editor] = useLexicalComposerContext();

  const onClick = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  return (
    <div className="flex space-x-2 p-2 border-b">
      <Button onMouseDown={(e) => e.preventDefault()} onClick={() => onClick('bold')}>Bold</Button>
      <Button onMouseDown={(e) => e.preventDefault()} onClick={() => onClick('italic')}>Italic</Button>
    </div>
  );
};

export default EditorToolbar;
