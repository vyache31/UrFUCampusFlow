import { useState, useEffect } from 'react';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import BotCaseCard from '../../components/cases/BotCaseCard/BotCaseCard';
import { getCases, type Case } from '../../services/cases';
import SendMessageModal from '../../components/Modals/SendMessageModal';
import AddCuratorModal from '../../components/Modals/AddCuratorModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import { PlusIcon, SendIcon } from '../../components/common/Icons/Icons';
import './botManagement.css';

interface Curator {
  id: string;
  name: string;
}

interface CaseWithCurators extends Case {
  curators: Curator[];
}

const BotManagementPage = () => {
  const [cases, setCases] = useState<CaseWithCurators[]>([]);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<'набор' | 'стоп набор'>('набор');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isCuratorModalOpen, setIsCuratorModalOpen] = useState(false);
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [allCurators, setAllCurators] = useState<Curator[]>([
    { id: '1', name: 'Анна Иванова' },
    { id: '2', name: 'Петр Петров' },
    { id: '3', name: 'Мария Сидорова' },
  ]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await getCases();
        const casesWithCurators = data.map(c => ({ ...c, curators: [] }));
        setCases(casesWithCurators);
      } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleSendMessage = (message: string) => {
    console.log('Отправка сообщения:', message);
  };

  const handleAddCuratorToCase = (caseId: string) => {
    setCurrentCaseId(caseId);
    setIsCuratorModalOpen(true);
  };

  const handleAddCurator = (curatorName: string) => {
    const newCurator: Curator = {
      id: Date.now().toString(),
      name: curatorName,
    };
    setAllCurators([...allCurators, newCurator]);
    
    if (currentCaseId) {
      setCases(prev => prev.map(c => 
        c.id === currentCaseId 
          ? { ...c, curators: [...c.curators, newCurator] }
          : c
      ));
    }
  };

  const handleRemoveCurator = (caseId: string, curatorId: string) => {
    setCases(prev => prev.map(c => 
      c.id === caseId 
        ? { ...c, curators: c.curators.filter(cur => cur.id !== curatorId) }
        : c
    ));
  };

  const handleSelectCurator = (curatorId: string) => {
    if (currentCaseId) {
      const curatorToAdd = allCurators.find(c => c.id === curatorId);
      if (curatorToAdd) {
        setCases(prev => prev.map(c => {
          if (c.id === currentCaseId && !c.curators.some(cur => cur.id === curatorId)) {
            return { ...c, curators: [...c.curators, curatorToAdd] };
          }
          return c;
        }));
      }
    }
  };

  const handleReset = () => {};

  const handleApply = () => {
    setIsCuratorModalOpen(false);
    setCurrentCaseId(null);
  };

  // Добавление новых кейсов (несколько)
  const handleAddCase = (caseId: string, caseTitle: string) => {
    const existingCase = cases.find(c => c.id === caseId);
    if (!existingCase) {
      const newCase: CaseWithCurators = {
        id: caseId,
        title: caseTitle,
        description: '',
        status: '',
        curators: [],
        semester: '',
        project_goals: '',
        required_result: '',
        grade_criteria: '',
        study_program: '',
        likes: 0,
        dislikes: 0
      };
      setCases(prev => [...prev, newCase]);
    }
  };

  // Удаление кейса
  const handleRemoveCase = (caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Управление ботом' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper bot-management-page">
        <Header />
        <div className="loading-container">Загрузка кейсов...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper bot-management-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="bot-header">
        <h1 className="page-title">Управление ботом</h1>
        <div className="bot-toggle">
          <button 
            className={`toggle-option ${botStatus === 'набор' ? 'active' : ''}`}
            onClick={() => setBotStatus('набор')}
          >
            Набор
          </button>
          <button 
            className={`toggle-option ${botStatus === 'стоп набор' ? 'active' : ''}`}
            onClick={() => setBotStatus('стоп набор')}
          >
            Стоп набор
          </button>
        </div>
        <button className="send-message-btn" onClick={() => setIsSendModalOpen(true)}>
          <SendIcon />
          <span>Отправить сообщение</span>
        </button>
      </div>

      <div className="cases-wrapper">
        {cases.map((caseItem) => (
          <BotCaseCard
            key={caseItem.id}
            id={caseItem.id}
            title={caseItem.title}
            description={caseItem.description || ''}
            curators={caseItem.curators}
            onAddCurator={() => handleAddCuratorToCase(caseItem.id)}
            onRemoveCurator={(curatorId) => handleRemoveCurator(caseItem.id, curatorId)}
            onRemoveCase={() => handleRemoveCase(caseItem.id)}
          />
        ))}
        {cases.length === 0 && (
          <div className="empty-cases">
            Нет активных кейсов
          </div>
        )}
      </div>

      <div className="add-case-section">
        <button className="add-case-btn" onClick={() => setIsAddCaseModalOpen(true)}>
          <PlusIcon />
          <span>Добавить кейс</span>
        </button>
      </div>

      <SendMessageModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendMessage}
      />

      <AddCuratorModal
        isOpen={isCuratorModalOpen}
        onClose={() => {
          setIsCuratorModalOpen(false);
          setCurrentCaseId(null);
        }}
        curators={allCurators}
        selectedCurators={currentCaseId ? cases.find(c => c.id === currentCaseId)?.curators.map(c => c.id) || [] : []}
        onToggleCurator={handleSelectCurator}
        onAddCurator={handleAddCurator}
        onReset={handleReset}
        onApply={handleApply}
      />

      <AddCaseModal
        isOpen={isAddCaseModalOpen}
        onClose={() => setIsAddCaseModalOpen(false)}
        onAdd={handleAddCase}
        existingCaseIds={cases.map(c => c.id)}
      />
    </div>
  );
};

export default BotManagementPage;