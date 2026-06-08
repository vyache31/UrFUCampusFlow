import { useState, useEffect } from 'react';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import BotCaseCard from '../../components/cases/BotCaseCard/BotCaseCard';
import { getCases, type Case } from '../../services/cases';
import { getBotMode, updateBotMode, getBotCases, addBotCase, deleteBotCase, getBotInterviews, deleteBotInterview, getBotCurators, addBotCurator, deleteBotCurator, sendBotMessage, type BotInterview, type BotCurator } from '../../services/bot';
import AddBotCuratorModal from '../../components/Modals/AddBotCuratorModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import SendMessageModal from '../../components/Modals/SendMessageModal';
import { PlusIcon, SendIcon, CloseIcon } from '../../components/common/Icons/Icons';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import './botManagement.css';

interface CaseWithData extends Case {
  botCaseId?: string;
  interviews: BotInterview[];
}

const BotManagementPage = () => {
  const { showSuccess, showError, showConfirm } = useToast();
  const [cases, setCases] = useState<CaseWithData[]>([]);
  const [botCuratorsList, setBotCuratorsList] = useState<BotCurator[]>([]);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<'набор' | 'стоп набор'>('набор');
  const [isCuratorModalOpen, setIsCuratorModalOpen] = useState(false);
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      showError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Произошла неизвестная ошибка';
  };

  const handleToggleMode = async (mode: 'набор' | 'стоп набор') => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newMode = mode === 'набор' ? 'recruitment' : 'stop';
      await updateBotMode(newMode);
      setBotStatus(mode);
      showSuccess(`Режим изменён на "${mode}"`);
    } catch (error) {
      console.error('Ошибка изменения режима:', error);
      showError(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await sendBotMessage(message);
      showSuccess('Сообщение успешно отправлено');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      showError(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCurator = async (curatorId: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await addBotCurator(curatorId);
      await fetchAllData(); 
      showSuccess('Куратор добавлен в список');
    } catch (error) {
      console.error('Ошибка добавления куратора:', error);
      showError(getErrorMessage(error));
    } finally {
      setIsCuratorModalOpen(false);
      setIsUpdating(false);
    }
  };

  const handleRemoveCurator = async (curatorRecordId: string) => {
    if (isUpdating) return;
    
    showConfirm({
      message: 'Удалить куратора из списка?',
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          await deleteBotCurator(curatorRecordId);
          await fetchAllData();
          showSuccess('Куратор удалён');
        } catch (error) {
          console.error('Ошибка удаления куратора:', error);
          showError(getErrorMessage(error));
        } finally {
          setIsUpdating(false);
        }
      },
      onCancel: () => {},
      confirmText: 'Да',
      cancelText: 'Нет'
    });
  };

  const handleAddCase = async (caseSemesterId: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const allCases = await getCases(100);
      const foundCase = allCases.find(c => c.case_semesters_id === caseSemesterId);
      
      if (foundCase) {
        await addBotCase(foundCase.id);
        await fetchAllData();
        showSuccess('Кейс добавлен в бот');
      } else {
        showError('Кейс не найден');
      }
    } catch (error) {
      console.error('Ошибка добавления кейса:', error);
      showError(getErrorMessage(error));
    } finally {
      setIsAddCaseModalOpen(false);
      setIsUpdating(false);
    }
  };

  const handleRemoveCase = async (caseId: string) => {
    if (isUpdating) return;
    
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem?.botCaseId) return;
    
    showConfirm({
      message: 'Удалить кейс из бота?',
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          await deleteBotCase(caseItem.botCaseId as string);
          setCases(prev => prev.filter(c => c.id !== caseId));
          showSuccess('Кейс удалён из бота');
        } catch (error) {
          console.error('Ошибка удаления кейса:', error);
          showError(getErrorMessage(error));
        } finally {
          setIsUpdating(false);
        }
      },
      onCancel: () => {},
      confirmText: 'Да',
      cancelText: 'Нет'
    });
  };

  const handleRemoveInterview = async (interviewId: string, caseId: string) => {
    if (isUpdating) return;
    
    showConfirm({
      message: 'Удалить запись на интервью?',
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          await deleteBotInterview(interviewId);
          setCases(prev => prev.map(c => 
            c.id === caseId 
              ? { ...c, interviews: c.interviews.filter(i => i.id !== interviewId) }
              : c
          ));
          showSuccess('Запись на интервью удалена');
        } catch (error) {
          console.error('Ошибка удаления интервью:', error);
          showError(getErrorMessage(error));
        } finally {
          setIsUpdating(false);
        }
      },
      onCancel: () => {},
      confirmText: 'Да',
      cancelText: 'Нет'
    });
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

  const usedCaseSemesterIds = cases
    .map(c => c.case_semesters_id)
    .filter((id): id is string => !!id);

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
            disabled={isUpdating}
          >
            Набор
          </button>
          <button 
            className={`toggle-option ${botStatus === 'стоп набор' ? 'active' : ''}`}
            onClick={() => handleToggleMode('стоп набор')}
            disabled={isUpdating}
          >
            Стоп набор
          </button>
        </div>
        <button className="send-message-btn" onClick={() => setIsSendModalOpen(true)} disabled={isUpdating}>
          <SendIcon />
          <span>Отправить сообщение</span>
        </button>
      </div>

      {/* Секция кураторов */}
      <div className="curators-section">
        <div className="curators-header">
          <h2 className="curators-title">Кураторы набора</h2>
          <button className="add-curator-btn-header" onClick={() => setIsCuratorModalOpen(true)} disabled={isUpdating}>
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
                    disabled={isUpdating}
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
        <button className="add-case-btn" onClick={() => setIsAddCaseModalOpen(true)} disabled={isUpdating} >
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
        usedCaseSemesterIds={usedCaseSemesterIds}
      />
    </div>
  );
};

export default BotManagementPage;