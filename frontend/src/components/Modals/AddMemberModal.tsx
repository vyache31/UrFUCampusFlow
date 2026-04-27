import { useState } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import './Modal.css';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: { name: string; role: string; university: string; group: string }) => void;
}

const AddMemberModal = ({ isOpen, onClose, onAdd }: AddMemberModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    university: '',
    group: ''
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onAdd(formData);
      setFormData({ name: '', role: '', university: '', group: '' });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-field">
            <label className="modal-label">ФИО:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите ФИО"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="modal-field">
            <label className="modal-label">Роль:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите роль"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>
          
          <div className="modal-field">
            <label className="modal-label">ВУЗ:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите ВУЗ"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            />
          </div>
          
          <div className="modal-field">
            <label className="modal-label">Группа:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите группу"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-add-btn" onClick={handleSubmit}>
            <CheckIcon />
            <span>Добавить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;