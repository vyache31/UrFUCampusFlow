import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  CHAT_PAGE_SIZE, createAIChat, deleteAIChat, getAIChatMessages, getAIChats,
  retryAIChatReply, sendAIChatMessage, type AIChat, type AIChatMessage,
} from '../services/aiChats';

const errorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;
  switch (error.response?.status) {
    case 404: return 'Диалог больше не доступен. Выберите другой или создайте новый.';
    case 409: return 'В диалоге уже готовится ответ или есть сообщение без ответа. Обновите историю.';
    case 422: return 'Сообщение или контекст слишком большой. Начните новый диалог с более коротким сообщением.';
    case 429: return 'Достигнут лимит запросов. Попробуйте позже.';
    case 502: return 'ИИ-сервис недоступен или вернул некорректный ответ. Можно повторить генерацию.';
    case 504: return 'ИИ не успел ответить. Сообщение сохранено, можно повторить генерацию.';
    default: return fallback;
  }
};

const mergeChats = (existing: AIChat[], incoming: AIChat[]): AIChat[] =>
  [...new Map([...existing, ...incoming].map(chat => [chat.id, chat])).values()];

export const useAIChat = (isOpen: boolean) => {
  const [chats, setChats] = useState<AIChat[]>([]);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sendingText, setSendingText] = useState('');
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const mounted = useRef(false);
  const operation = useRef(false);
  const currentId = useRef<string | null>(null);
  const historyRequest = useRef<AbortController | null>(null);
  const initialized = useRef(false);
  const offset = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      historyRequest.current?.abort();
    };
  }, []);

  const loadHistory = useCallback(async (chatId: string): Promise<AIChatMessage[] | null> => {
    historyRequest.current?.abort();
    const controller = new AbortController();
    historyRequest.current = controller;
    setHistoryLoading(true);
    setHistoryLoaded(false);
    setHistoryError('');
    try {
      const data = await getAIChatMessages(chatId, controller.signal);
      if (!mounted.current || controller.signal.aborted || currentId.current !== chatId) return null;
      setMessages(data);
      setHistoryLoaded(true);
      return data;
    } catch (error) {
      if (!controller.signal.aborted && mounted.current && currentId.current === chatId) {
        setHistoryError(errorMessage(error, 'Не удалось загрузить историю. Обновите её перед отправкой сообщения.'));
      }
      return null;
    } finally {
      if (mounted.current && !controller.signal.aborted && currentId.current === chatId) setHistoryLoading(false);
    }
  }, []);

  const selectChat = useCallback(async (id: string) => {
    if (operation.current) return;
    currentId.current = id;
    setSelectedId(id);
    setMessages([]);
    setError('');
    await loadHistory(id);
  }, [loadHistory]);

  useEffect(() => {
    if (!isOpen || initialized.current) return;
    const controller = new AbortController();
    const initialize = async () => {
      try {
        const data = await getAIChats(0, controller.signal);
        if (controller.signal.aborted || !mounted.current) return;
        setChats(data);
        offset.current = data.length;
        setHasMore(data.length === CHAT_PAGE_SIZE);
        setListError('');
        initialized.current = true;
        if (data[0]) await selectChat(data[0].id);
      } catch (error) {
        if (!controller.signal.aborted && mounted.current) {
          setListError(errorMessage(error, 'Не удалось загрузить диалоги.'));
        }
      } finally {
        if (!controller.signal.aborted && mounted.current) setListLoading(false);
      }
    };
    void initialize();
    return () => controller.abort();
  }, [isOpen, selectChat]);

  const loadChats = async (more = false) => {
    setListLoading(true);
    setListError('');
    try {
      const data = await getAIChats(more ? offset.current : 0);
      if (!mounted.current) return;
      setChats(previous => {
        if (more) return mergeChats(previous, data);
        const selected = previous.find(chat => chat.id === currentId.current);
        return selected && !data.some(chat => chat.id === selected.id) ? [...data, selected] : data;
      });
      offset.current = (more ? offset.current : 0) + data.length;
      setHasMore(data.length === CHAT_PAGE_SIZE);
      initialized.current = true;
    } catch (error) {
      if (mounted.current) setListError(errorMessage(error, 'Не удалось загрузить диалоги.'));
    } finally {
      if (mounted.current) setListLoading(false);
    }
  };

  const newChat = () => {
    if (operation.current) return;
    historyRequest.current?.abort();
    currentId.current = null;
    setSelectedId(null);
    setMessages([]);
    setError('');
    setHistoryError('');
    setHistoryLoading(false);
    setHistoryLoaded(true);
  };

  const send = async (text?: string): Promise<{ saved: boolean; chatId: string | null }> => {
    if (operation.current || !historyLoaded || historyLoading) return { saved: false, chatId: currentId.current };
    operation.current = true;
    setBusy(true);
    setError('');
    setSendingText(text ?? '');
    let id = currentId.current;
    let saved = false;
    let requestError = '';
    const lastPosition = messages.at(-1)?.position ?? 0;
    try {
      if (!id) {
        if (!text) return { saved: false, chatId: id };
        const chat = await createAIChat(text.slice(0, 200));
        id = chat.id;
        currentId.current = id;
        if (!mounted.current) return { saved: false, chatId: id };
        setSelectedId(id);
        setChats(previous => [chat, ...previous]);
      }
      if (text !== undefined) await sendAIChatMessage(id, text);
      else await retryAIChatReply(id);
      saved = true;
    } catch (error) {
      requestError = errorMessage(error, 'Не удалось получить ответ. Обновите историю, чтобы проверить сохранённое сообщение.');
    } finally {
      if (mounted.current) {
        if (id) {
          const actual = await loadHistory(id);
          if (actual) {
            setSendingText('');
            if (text && actual.some(item => item.role === 'user' && item.position > lastPosition && item.content === text)) saved = true;
            if (actual.at(-1)?.role === 'assistant' && (actual.at(-1)?.position ?? 0) > lastPosition) requestError = '';
          }
          await loadChats();
        }
        if (mounted.current) {
          setError(requestError);
          setBusy(false);
          setSendingText('');
        }
      }
      operation.current = false;
    }
    return { saved, chatId: id };
  };

  const removeChat = async (id: string) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setListError('');
    try {
      await deleteAIChat(id);
      if (!mounted.current) return;
      if (currentId.current === id) {
        historyRequest.current?.abort();
        currentId.current = null;
        setSelectedId(null);
        setMessages([]);
        setHistoryError('');
        setHistoryLoaded(true);
        setHistoryLoading(false);
        setError('');
      }
      await loadChats();
    } catch (error) {
      if (mounted.current) setListError(errorMessage(error, 'Не удалось удалить диалог.'));
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const pendingReply = messages.at(-1)?.role === 'user';
  useEffect(() => {
    if (!isOpen || !selectedId || !pendingReply || busy || !historyLoaded) return;
    const controller = new AbortController();
    let fetching = false;
    const timer = window.setInterval(async () => {
      if (fetching) return;
      fetching = true;
      try {
        const data = await getAIChatMessages(selectedId, controller.signal);
        if (!controller.signal.aborted && mounted.current && currentId.current === selectedId) {
          setMessages(previous => (data.at(-1)?.position ?? 0) >= (previous.at(-1)?.position ?? 0) ? data : previous);
          if (data.at(-1)?.role === 'assistant') setError('');
        }
      } catch (error) {
        if (!controller.signal.aborted && mounted.current) {
          setHistoryError(errorMessage(error, 'Не удалось обновить историю. Обновите её вручную.'));
          setHistoryLoaded(false);
        }
      } finally {
        fetching = false;
      }
    }, 5000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [isOpen, selectedId, pendingReply, busy, historyLoaded]);

  return {
    chats, messages, selectedId, listLoading, hasMore, historyLoading, historyLoaded,
    busy, sendingText, pendingReply, error, listError, historyError,
    selectChat, newChat, send, removeChat, loadChats,
    refreshHistory: () => currentId.current ? loadHistory(currentId.current) : Promise.resolve(null),
  };
};
