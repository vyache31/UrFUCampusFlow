import { useState } from 'react';
import { CloseIcon } from '../common/Icons/Icons';
import './Modal.css';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

const SendMessageModal = ({ isOpen, onClose, onSend }: SendMessageModalProps) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-drag-handle"></div>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          <textarea
            className="message-textarea"
            placeholder="Введите сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <div className="modal-footer">
          <button className="modal-send-btn" onClick={handleSend}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;