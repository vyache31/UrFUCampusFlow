import { useCallback, useEffect, useRef } from 'react';

interface UseEditableFieldOptions {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  maxHeight?: number;
  placeholder?: string;
}

const RESIZE_DEBOUNCE_MS = 10;

export const useEditableField = ({
  value,
  onChange,
  maxLength,
  maxHeight,
  placeholder,
}: UseEditableFieldOptions) => {
  const ref = useRef<HTMLDivElement>(null);

  const checkHeight = useCallback(() => {
    const el = ref.current;
    if (!el || maxHeight === undefined) return;
    const shouldScroll = el.scrollHeight > maxHeight;
    el.style.maxHeight = shouldScroll ? `${maxHeight}px` : 'none';
    el.style.overflowY = shouldScroll ? 'auto' : 'visible';
    el.classList.toggle('with-scroll', shouldScroll);
  }, [maxHeight]);

  const syncEmptyClass = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const isEmpty = el.innerText.trim() === '';
    el.classList.toggle('empty', isEmpty);
    if (placeholder) el.setAttribute('data-placeholder', placeholder);
  }, [placeholder]);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.innerText === value) return;
    el.innerText = value;
    syncEmptyClass();
    setTimeout(checkHeight, RESIZE_DEBOUNCE_MS);
  }, [value, checkHeight, syncEmptyClass]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () =>
      setTimeout(() => {
        checkHeight();
        syncEmptyClass();
      }, RESIZE_DEBOUNCE_MS);
    el.addEventListener('input', handler);
    el.addEventListener('paste', handler);
    el.addEventListener('keydown', handler);
    const observer = new MutationObserver(handler);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    checkHeight();
    syncEmptyClass();
    return () => {
      observer.disconnect();
      el.removeEventListener('input', handler);
      el.removeEventListener('paste', handler);
      el.removeEventListener('keydown', handler);
    };
  }, [checkHeight, syncEmptyClass]);

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!maxLength) return;
    const { innerText } = e.currentTarget;
    const { data } = e.nativeEvent as InputEvent;
    if (innerText.length + (data?.length ?? 0) > maxLength) e.preventDefault();
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    let next = e.currentTarget.innerText;
    if (maxLength && next.length > maxLength) {
      next = next.slice(0, maxLength);
      e.currentTarget.innerText = next;
    }
    onChange(next);
    setTimeout(() => {
      checkHeight();
      syncEmptyClass();
    }, RESIZE_DEBOUNCE_MS);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (!selection || !ref.current) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(text));
    selection.collapseToEnd();
    onChange(ref.current.innerText);
  };

  return { ref, handleInput, handleBeforeInput, handlePaste };
};