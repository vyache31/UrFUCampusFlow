import { useState } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { createStudent } from '../../services/students';
import './Modal.css';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: { 
    studentId: string; 
    name: string; 
    role: string; 
    group: string;
    universityId: number;
  }) => void;
}

const AddMemberModal = ({ isOpen, onClose, onAdd }: AddMemberModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    group: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Введите ФИО');
      return;
    }
    
    if (!formData.role.trim()) {
      setError('Введите роль');
      return;
    }
    
    if (!formData.group.trim()) {
      setError('Введите группу');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const universityId = 1;
      
      const student = await createStudent({
        name: formData.name,
        group: formData.group,
        university_id: universityId
      });
      
      onAdd({
        studentId: student.id,
        name: formData.name,
        role: formData.role,
        group: formData.group,
        universityId: universityId
      });
      
      setFormData({ name: '', role: '', group: '' });
      onClose();
    } catch (err) {
      console.error('Ошибка создания студента:', err);
      setError('Не удалось создать студента');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <button className="modal-close-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message" style={{ marginBottom: '15px', color: '#F63333' }}>{error}</div>}
          
          <div className="modal-field">
            <label className="modal-label">ФИО:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите ФИО"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-add-btn" onClick={handleSubmit} disabled={loading}>
            <CheckIcon />
            <span>{loading ? 'Сохранение...' : 'Добавить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;