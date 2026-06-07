import { useState, useEffect } from 'react';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import BotCaseCard from '../../components/cases/BotCaseCard/BotCaseCard';
import { getCases, type Case } from '../../services/cases';
import { getBotMode, updateBotMode, getBotCases, addBotCase, deleteBotCase, getBotInterviews, deleteBotInterview, getBotCurators, addBotCurator, deleteBotCurator, type BotInterview, type BotCurator } from '../../services/bot';
import SendMessageModal from '../../components/Modals/SendMessageModal';
import AddBotCuratorModal from '../../components/Modals/AddBotCuratorModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import { PlusIcon, SendIcon, CloseIcon } from '../../components/common/Icons/Icons';
import './botManagement.css';

interface CaseWithData extends Case {
  botCaseId?: string;
  interviews: BotInterview[];
}

const BotManagementPage = () => {
  const [cases, setCases] = useState<CaseWithData[]>([]);
  const [botCuratorsList, setBotCuratorsList] = useState<BotCurator[]>([]);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<'набор' | 'стоп набор'>('набор');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isCuratorModalOpen, setIsCuratorModalOpen] = useState(false);
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [mode, botCasesData, interviewsData, allCases, botCurators] = await Promise.all([
        getBotMode(),
        getBotCases(),
        getBotInterviews(),
        getCases(100),
        getBotCurators()
      ]);
      
      setBotStatus((mode.mode as string) === 'recruitment' ? 'набор' : 'стоп набор');
      setBotCuratorsList(botCurators);
      
      const interviewsByBotCaseId = new Map<string, BotInterview[]>();
      interviewsData.forEach(interview => {
        const botCaseId = interview.case_id;
        if (!interviewsByBotCaseId.has(botCaseId)) {
          interviewsByBotCaseId.set(botCaseId, []);
        }
        interviewsByBotCaseId.get(botCaseId)!.push(interview);
      });
      
      const casesWithData = allCases
        .filter(c => botCasesData.some(bc => bc.case_id === c.id))
        .map(c => {
          const botCase = botCasesData.find(bc => bc.case_id === c.id);
          return {
            ...c,
            botCaseId: botCase?.id,
            interviews: botCase ? (interviewsByBotCaseId.get(botCase.id) || []) : []
          };
        });
      
      setCases(casesWithData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleToggleMode = async (mode: 'набор' | 'стоп набор') => {
    try {
      const newMode = mode === 'набор' ? 'recruitment' : 'stop';
      await updateBotMode(newMode);
      setBotStatus(mode);
    } catch (error) {
      console.error('Ошибка изменения режима:', error);
      alert('Не удалось изменить режим');
    }
  };

  const handleSendMessage = (message: string) => {
    console.log('Отправка сообщения:', message);
  };

  const handleAddCurator = async (curatorId: string) => {
    try {
      await addBotCurator(curatorId);
      await fetchAllData(); 
      alert('Куратор добавлен в список');
    } catch (error) {
      console.error('Ошибка добавления куратора:', error);
      alert('Не удалось добавить куратора');
    } finally {
      setIsCuratorModalOpen(false);
    }
  };

  const handleRemoveCurator = async (curatorRecordId: string) => {
    if (!window.confirm('Удалить куратора из списка?')) return;
    
    try {
      await deleteBotCurator(curatorRecordId);
      await fetchAllData();
      alert('Куратор удален');
    } catch (error) {
      console.error('Ошибка удаления куратора:', error);
      alert('Не удалось удалить куратора');
    }
  };

  const handleAddCase = async (caseId: string) => {
    try {
      await addBotCase(caseId);
      await fetchAllData();
    } catch (error) {
      console.error('Ошибка добавления кейса:', error);
      alert('Не удалось добавить кейс');
    }
  };

  const handleRemoveCase = async (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem?.botCaseId) return;
    
    if (!window.confirm('Удалить кейс из бота?')) return;
    
    try {
      await deleteBotCase(caseItem.botCaseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (error) {
      console.error('Ошибка удаления кейса:', error);
      alert('Не удалось удалить кейс');
    }
  };

  const handleRemoveInterview = async (interviewId: string, caseId: string) => {
    if (!window.confirm('Удалить запись на интервью?')) return;
    
    try {
      await deleteBotInterview(interviewId);
      setCases(prev => prev.map(c => 
        c.id === caseId 
          ? { ...c, interviews: c.interviews.filter(i => i.id !== interviewId) }
          : c
      ));
    } catch (error) {
      console.error('Ошибка удаления интервью:', error);
      alert('Не удалось удалить интервью');
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Управление ботом' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper bot-management-page">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  const getCuratorDisplay = (curator: BotCurator) => {
    return curator.user_email || `Куратор ${curator.user_id.slice(-4)}`;
  };

  return (
    <div className="page-wrapper bot-management-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="bot-header">
        <h1 className="page-title">Управление ботом</h1>
        <div className="bot-toggle">
          <button 
            className={`toggle-option ${botStatus === 'набор' ? 'active' : ''}`}
            onClick={() => handleToggleMode('набор')}
          >
            Набор
          </button>
          <button 
            className={`toggle-option ${botStatus === 'стоп набор' ? 'active' : ''}`}
            onClick={() => handleToggleMode('стоп набор')}
          >
            Стоп набор
          </button>
        </div>
        <button className="send-message-btn" onClick={() => setIsSendModalOpen(true)}>
          <SendIcon />
          <span>Отправить сообщение</span>
        </button>
      </div>

      {/* Секция кураторов */}
      <div className="curators-section">
        <div className="curators-header">
          <h2 className="curators-title">Кураторы набора</h2>
          <button className="add-curator-btn-header" onClick={() => setIsCuratorModalOpen(true)}>
            <PlusIcon />
            <span>Добавить куратора</span>
          </button>
        </div>
        <div className="curators-list-wrapper">
          {botCuratorsList.length > 0 ? (
            <div className="curators-grid">
              {botCuratorsList.map((curator) => (
                <div key={curator.id} className="curator-card">
                  <span className="curator-name">{getCuratorDisplay(curator)}</span>
                  <button 
                    className="remove-curator-card"
                    onClick={() => handleRemoveCurator(curator.id)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-curators-list">
              Нет добавленных кураторов
            </div>
          )}
        </div>
      </div>

      {/* Секция кейсов */}
      <div className="cases-wrapper">
        {cases.map((caseItem) => (
          <BotCaseCard
            key={caseItem.id}
            id={caseItem.id}
            title={caseItem.title}
            description={caseItem.description || ''}
            interviews={caseItem.interviews}
            onRemoveCase={() => handleRemoveCase(caseItem.id)}
            onRemoveInterview={(interviewId) => handleRemoveInterview(interviewId, caseItem.id)}
          />
        ))}
        {cases.length === 0 && (
          <div className="empty-cases">
            Нет активных кейсов для набора
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

      <AddBotCuratorModal
        isOpen={isCuratorModalOpen}
        onClose={() => setIsCuratorModalOpen(false)}
        onAssign={handleAddCurator}
        existingCuratorIds={botCuratorsList.map(c => c.user_id)}
      />

      <AddCaseModal
        isOpen={isAddCaseModalOpen}
        onClose={() => setIsAddCaseModalOpen(false)}
        onAdd={handleAddCase}
        usedCaseIds={cases.map(c => c.id)}
      />
    </div>
  );
};

export default BotManagementPage;