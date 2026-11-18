import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GenerateIcon, SendIcon } from '../common/Icons/Icons';
import { useAIChat } from '../../hooks/useAIChat';
import type { AICaseDraft } from '../../services/aiChats';
import './CaseAssistantChat.css';

interface CaseAssistantChatProps {
  onTransfer: (draft: AICaseDraft) => void;
}

const INITIAL_MESSAGE = 'Привет! Я помогу проработать идею кейса. Расскажи, какую задачу или проблему ты хочешь предложить студентам.';

const DRAFT_FIELDS: { key: keyof AICaseDraft; label: string }[] = [
  { key: 'title', label: 'Название' },
  { key: 'short_title', label: 'Короткое название' },
  { key: 'project_goals', label: 'Описание' },
  { key: 'required_result', label: 'Ожидаемый результат' },
  { key: 'grade_criteria', label: 'Критерии оценки' },
];

const CaseAssistantChat = ({ onTransfer }: CaseAssistantChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const chat = useAIChat(isOpen);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputKey = chat.selectedId ?? 'new';
  const input = drafts[inputKey] ?? '';
  const selected = chat.chats.find(item => item.id === chat.selectedId);
  const filledFields = DRAFT_FIELDS.filter(field => chat.caseDraft?.[field.key]);
  const blocked = chat.busy || chat.historyLoading || !chat.historyLoaded || chat.listLoading;

  useEffect(() => {
    if (isOpen && !showChats) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.sendingText, isOpen, showChats]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked || chat.pendingReply || !input.trim()) return;
    const key = inputKey;
    const result = await chat.send(input.trim());
    setDrafts(previous => ({
      ...previous,
      [key]: result.saved ? '' : input,
      [result.chatId ?? key]: result.saved ? '' : input,
    }));
  };

  const handleNewChat = () => {
    chat.newChat();
    setShowChats(false);
    setDeleteId(null);
  };

  return (
    <div className="case-assistant">
      {isOpen && (
        <section className="case-assistant__panel" aria-label="Чат-помощник по созданию кейса">
          <header className="case-assistant__header">
            <div className="case-assistant__avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5a8.5 8.5 0 0 0-7.2 13l-.9 3 3.2-.8A8.5 8.5 0 1 0 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 10h7M8.5 13.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <div className="case-assistant__heading">
              <strong>ИИ-помощник</strong>
              <span><i /> {chat.busy ? 'Обрабатываем запрос…' : 'Помощь в создании кейса'}</span>
            </div>
            <button className="case-assistant__close" type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть чат">
              <svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </header>
          <nav className="case-assistant__toolbar" aria-label="Управление диалогами">
            <button type="button" aria-pressed={showChats} onClick={() => setShowChats(value => !value)}>Диалоги</button>
            <span title={selected?.title}>{chat.selectedId ? selected?.title ?? 'Диалог' : 'Новый диалог'}</span>
            <button type="button" onClick={handleNewChat} disabled={chat.busy || chat.listLoading}>+ Новый</button>
          </nav>
          {showChats ? (
            <div className="case-assistant__chats">
              <h3>Ваши диалоги</h3>
              {chat.listLoading && <p className="case-assistant__status" role="status">Загружаем диалоги…</p>}
              {chat.listError && <div className="case-assistant__error" role="alert"><p>{chat.listError}</p><button type="button" disabled={chat.listLoading || chat.busy} onClick={() => void chat.loadChats()}>Обновить список</button></div>}
              {!chat.chats.length && !chat.listLoading && !chat.listError && <p className="case-assistant__status">Здесь появятся ваши разговоры с ИИ. Начните новый диалог.</p>}
              {chat.chats.map(item => (
                <div className={`case-assistant__chat${item.id === chat.selectedId ? ' case-assistant__chat--selected' : ''}`} key={item.id}>
                  <button className="case-assistant__chat-select" type="button" disabled={chat.busy || chat.listLoading} aria-current={item.id === chat.selectedId ? 'true' : undefined} onClick={() => {
                    void chat.selectChat(item.id);
                    setShowChats(false);
                    setDeleteId(null);
                  }}>
                    <strong>{item.title}</strong>
                    <span>{new Date(item.updated_at ?? item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                  </button>
                  {deleteId === item.id ? (
                    <div className="case-assistant__delete-confirm">
                      <span>Удалить переписку?</span>
                      <button type="button" disabled={chat.busy} onClick={() => { void chat.removeChat(item.id); setDeleteId(null); }}>Удалить</button>
                      <button type="button" disabled={chat.busy} onClick={() => setDeleteId(null)}>Отмена</button>
                    </div>
                  ) : <button className="case-assistant__delete" type="button" disabled={chat.busy || chat.listLoading} aria-label={`Удалить диалог «${item.title}»`} onClick={() => setDeleteId(item.id)}>Удалить</button>}
                </div>
              ))}
              {chat.hasMore && <button className="case-assistant__text-button" type="button" disabled={chat.listLoading || chat.busy} onClick={() => void chat.loadChats(true)}>Ещё диалоги</button>}
            </div>
          ) : (
            <>
              <div className="case-assistant__messages" aria-live="polite" aria-busy={chat.busy || chat.historyLoading}>
                {chat.listLoading && !chat.messages.length && <p className="case-assistant__status" role="status">Загружаем диалоги…</p>}
                {chat.listError && <div className="case-assistant__error" role="alert"><p>{chat.listError}</p><button type="button" disabled={chat.busy || chat.listLoading} onClick={() => void chat.loadChats()}>Обновить список</button></div>}
                {chat.historyLoading && <p className="case-assistant__status" role="status">Загружаем историю…</p>}
                {!chat.messages.length && !chat.historyLoading && !chat.listLoading && !chat.historyError && <div className="case-assistant__message case-assistant__message--assistant">{INITIAL_MESSAGE}</div>}
                {chat.messages.map(message => <div key={message.id} className={`case-assistant__message case-assistant__message--${message.role}`}>{message.content}</div>)}
                {chat.sendingText && !chat.historyLoading && <div className="case-assistant__message case-assistant__message--user">{chat.sendingText}</div>}
                {chat.busy && <p className="case-assistant__status" role="status">ИИ готовит ответ…</p>}
                {chat.error && <div className="case-assistant__error" role="alert">{chat.error}</div>}
                {chat.historyError && <div className="case-assistant__error" role="alert">{chat.historyError}</div>}
                {chat.selectedId && !chat.busy && (chat.pendingReply || chat.historyError) && (
                  <div className="case-assistant__recovery">
                    {chat.pendingReply && <><p>На последнее сообщение пока нет ответа.</p><button type="button" disabled={blocked} onClick={() => void chat.send()}>Повторить генерацию</button></>}
                    <button type="button" disabled={chat.historyLoading} onClick={() => void chat.refreshHistory()}>Обновить историю</button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {chat.caseDraft && !chat.busy && !chat.pendingReply && !chat.historyLoading && chat.historyLoaded && (
                <div className="case-assistant__draft">
                  <details className="case-assistant__draft-preview">
                    <summary>Черновик кейса · {filledFields.length}/5 полей</summary>
                    <dl>
                      {DRAFT_FIELDS.map(field => (
                        <div key={field.key}>
                          <dt>{field.label}</dt>
                          <dd>{chat.caseDraft?.[field.key] ?? 'Пока не заполнено'}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  <div className="case-assistant__draft-copy"><span>Перенесём заполненные поля. Неизвестные значения не заменят ваши данные.</span></div>
                  <button type="button" disabled={!filledFields.length} onClick={() => { if (chat.caseDraft) onTransfer(chat.caseDraft); }}>Перенести в форму</button>
                </div>
              )}
              <form className="case-assistant__composer" onSubmit={event => void handleSend(event)}>
                <textarea rows={2} maxLength={8000} value={input} onChange={event => setDrafts(previous => ({ ...previous, [inputKey]: event.target.value }))} disabled={blocked || chat.pendingReply} placeholder={chat.pendingReply ? 'Сначала получите ответ на сообщение' : 'Опишите идею кейса…'} aria-label="Сообщение помощнику" onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }} />
                <button type="submit" disabled={blocked || chat.pendingReply || !input.trim()} aria-label="Отправить сообщение"><SendIcon /></button>
              </form>
              <div className="case-assistant__input-hint">Enter — отправить · Shift + Enter — новая строка <span>{input.length}/8000</span></div>
            </>
          )}
        </section>
      )}
      <button className={`case-assistant__launcher${isOpen ? ' case-assistant__launcher--open' : ''}`} type="button" onClick={() => setIsOpen(open => !open)} aria-label={isOpen ? 'Закрыть чат-помощник' : 'Открыть чат-помощник'} aria-expanded={isOpen}>
        {isOpen ? <svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> : <GenerateIcon />}
      </button>
    </div>
  );
};

export default CaseAssistantChat;
