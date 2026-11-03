import { useEditableField } from './useEditableField';
import './editableField.css';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  maxHeight?: number;
}

const DEFAULT_MAX_HEIGHT = 53;

const EditableField = ({
  value,
  onChange,
  placeholder,
  maxLength,
  className = '',
  maxHeight = DEFAULT_MAX_HEIGHT,
}: EditableFieldProps) => {
  const { ref, handleInput, handleBeforeInput, handlePaste } = useEditableField({
    value,
    onChange,
    maxLength,
    maxHeight,
    placeholder,
  });

  return (
    <div
      ref={ref}
      className={`editable-field ${className}`}
      contentEditable
      suppressContentEditableWarning
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onPaste={handlePaste}
      data-placeholder={placeholder}
    />
  );
};

export default EditableField;