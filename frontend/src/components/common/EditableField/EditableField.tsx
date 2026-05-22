import { useEffect, useRef, useCallback } from 'react';
import './editableField.css';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  maxHeight?: number;
}

const EditableField = ({ 
  value, 
  onChange, 
  placeholder, 
  maxLength, 
  className = '',
  maxHeight = 53
}: EditableFieldProps) => {
  const divRef = useRef<HTMLDivElement>(null);

  const checkHeight = useCallback(() => {
    if (!divRef.current) return;
    
    const element = divRef.current;
    const scrollHeight = element.scrollHeight;
    
    if (scrollHeight > maxHeight) {
      element.style.maxHeight = maxHeight + 'px';
      element.style.overflowY = 'auto';
      element.classList.add('with-scroll');
    } else {
      element.style.maxHeight = 'none';
      element.style.overflowY = 'visible';
      element.classList.remove('with-scroll');
    }
  }, [maxHeight]);

  useEffect(() => {
    if (divRef.current && divRef.current.innerText !== value) {
      divRef.current.innerText = value;
      setTimeout(checkHeight, 10);
    }
  }, [value, checkHeight]);

  useEffect(() => {
    const div = divRef.current;
    if (div) {
      div.addEventListener('input', () => setTimeout(checkHeight, 10));
      div.addEventListener('paste', () => setTimeout(checkHeight, 50));
      div.addEventListener('keydown', () => setTimeout(checkHeight, 10));
      
      const observer = new MutationObserver(() => checkHeight());
      observer.observe(div, { childList: true, subtree: true, characterData: true });
      
      checkHeight();
      return () => observer.disconnect();
    }
  }, [checkHeight]);

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!maxLength) return;
    const target = e.currentTarget;
    const currentLength = target.innerText.length;
    const inputEvent = e.nativeEvent as InputEvent;
    const insertedText = inputEvent.data || '';
    
    if (currentLength + insertedText.length > maxLength) {
      e.preventDefault();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    let newValue = e.currentTarget.innerText;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
      e.currentTarget.innerText = newValue;
    }
    onChange(newValue);
    setTimeout(checkHeight, 10);
  };

  // Плейсхолдер
  useEffect(() => {
    if (divRef.current && placeholder) {
      if (divRef.current.innerText === '') {
        divRef.current.setAttribute('data-placeholder', placeholder);
        divRef.current.classList.add('has-placeholder');
      } else {
        divRef.current.removeAttribute('data-placeholder');
        divRef.current.classList.remove('has-placeholder');
      }
    }
  }, [value, placeholder]);

  return (
    <div
      ref={divRef}
      className={`editable-field ${className}`}
      contentEditable
      suppressContentEditableWarning
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      data-placeholder={placeholder}
    />
  );
};

export default EditableField;