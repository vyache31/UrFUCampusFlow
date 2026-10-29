import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GenerateIcon, SendIcon } from '../common/Icons/Icons';
import './CaseAssistantChat.css';

export interface CaseDraft {
  title: string;
  shortTitle: string;
  description: string;
  expectedResult: string;
  criteria: string;
}

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

interface CaseAssistantChatProps {
  onTransfer: (draft: CaseDraft) => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: 'assistant',
  text: 'Привет! Я помогу проработать идею кейса. Расскажи, какую задачу или проблему ты хочешь предложить студентам.',
};

const createDraft = (idea: string): CaseDraft => {
  const cleanIdea = idea.trim().replace(/\s+/g, ' ');
  const title = cleanIdea.length > 100 ? `${cleanIdea.slice(0, 97).trim()}...` : cleanIdea;
  return {
    title: title || 'Новый проектный кейс',
    shortTitle: (title || 'Новый кейс').slice(0, 50),
    description: `Цель кейса — проработать следующую задачу: ${cleanIdea}\n\nУчастникам предстоит изучить контекст и ограничения, определить основные проблемы, предложить варианты решения и обосновать выбранный подход.`,
    expectedResult: 'Подготовленное предложение решения с описанием подхода, ожидаемого эффекта и шагов реализации.',
    criteria: '1. Соответствие решения поставленной задаче.\n2. Обоснованность и реализуемость предложенного подхода.\n3. Учет ограничений и потребностей целевой аудитории.\n4. Ясность презентации и аргументации.',
  };
};

const CaseAssistantChat = ({ onTransfer }: CaseAssistantChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const nextId = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setDraft(createDraft(text));
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: 'user', text },
      { id: nextId.current++, role: 'assistant', text: 'Спасибо, записал идею! Сейчас это демонстрационный режим: я подготовил черновую структуру кейса на основе твоего сообщения. Её можно перенести в форму и отредактировать.' },
    ]);
    setInput('');
  };

  const handleTransfer = () => {
    if (!draft) return;
    onTransfer(draft);
    setIsOpen(false);
  };

  return (
    <div className="case-assistant">
      {isOpen && (
        <section className="case-assistant__panel" aria-label="Чат-помощник по созданию кейса">
          <header className="case-assistant__header">
            <div className="case-assistant__avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5a8.5 8.5 0 0 0-7.2 13l-.9 3 3.2-.8A8.5 8.5 0 1 0 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 10h7M8.5 13.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <div className="case-assistant__heading"><strong>ИИ-помощник</strong><span><i /> Помощь в генерации кейса</span></div>
            <button className="case-assistant__close" type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть чат"><svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
          </header>
          <div className="case-assistant__messages" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`case-assistant__message case-assistant__message--${message.role}`}>{message.text}</div>)}
            <div ref={messagesEndRef} />
          </div>
          {draft && <div className="case-assistant__draft"><div className="case-assistant__draft-copy"><strong>Черновик кейса готов</strong><span>Название, описание, результат и критерии</span></div><button type="button" onClick={handleTransfer}>Перенести в форму</button></div>}
          <form className="case-assistant__composer" onSubmit={handleSend}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Опиши идею кейса..." aria-label="Сообщение помощнику" />
            <button type="submit" disabled={!input.trim()} aria-label="Отправить сообщение"><SendIcon /></button>
          </form>
        </section>
      )}
      <button className={`case-assistant__launcher${isOpen ? ' case-assistant__launcher--open' : ''}`} type="button" onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? 'Закрыть чат-помощник' : 'Открыть чат-помощник'} aria-expanded={isOpen}>
        {isOpen ? <svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> : <GenerateIcon />}
      </button>
    </div>
  );
};

export default CaseAssistantChat;
