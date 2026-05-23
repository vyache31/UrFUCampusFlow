import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import StatusFilter from '../../components/cases/CaseFilters/StatusFilter';
import SemesterFilter from '../../components/cases/CaseFilters/SemesterFilter';
import BulkActionsBar from '../../components/cases/BulkActions/BulkActionsBar';
import ActionsDropdown from '../../components/sent-cases/ActionsDropdown';
import CaseCard from '../../components/cases/CaseCard/CaseCard';
import { getCases, deleteCase, sendToReview, rejectCase, activateCase, archiveCase, type Case } from '../../services/cases';
import './casesPage.css';

const CasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Все кейсы');
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await getCases(100);
        setCases(data);
      } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const availableSemesters = useMemo(() => {
    const semesters = [...new Set(cases.map(c => c.semester).filter(Boolean))] as string[];
    return semesters;
  }, [cases]);

  const getStatusForFilter = (status: string) => {
    if (status === 'Все кейсы') return 'Все кейсы';
    return status;
  };

  const filteredCases = cases.filter(caseItem => {
    if (statusFilter !== 'Все кейсы') {
      const filterStatus = getStatusForFilter(statusFilter);
      if (caseItem.status !== filterStatus) return false;
    }
    if (selectedSemesters.length > 0 && !selectedSemesters.includes(caseItem.semester || '')) {
      return false;
    }
    return true;
  });

  const selectedCases = cases.filter(c => selectedCaseIds.includes(c.id));

  const getAvailableActions = useMemo(() => {
    if (selectedCaseIds.length === 0) return { actions: [], isMixed: false };

    const actionsMap = new Map<string, string[]>();
    
    selectedCases.forEach(c => {
      const actions: string[] = [];
      const status = c.status;
      
      if (status === 'Черновик') {
        actions.push('Отправить на оценку');
      } else if (status === 'На оценке') {
        actions.push('Одобрить', 'Отправить на доработку');
      } else if (status === 'Активный') {
        actions.push('Архивировать');
      } else if (status === 'На доработке') {
        actions.push('Отправить на оценку');
      } else if (status === 'Архивирован') {
        // Нет действий
      }
      
      actionsMap.set(c.id, actions);
    });

    const firstActions = actionsMap.get(selectedCaseIds[0]) || [];
    let isMixed = false;
    
    for (const caseId of selectedCaseIds) {
      const currentActions = actionsMap.get(caseId) || [];
      if (JSON.stringify(firstActions) !== JSON.stringify(currentActions)) {
        isMixed = true;
        break;
      }
    }

    if (isMixed) {
      return { actions: [], isMixed: true };
    }

    return { actions: firstActions, isMixed: false };
  }, [selectedCaseIds, selectedCases]);

  const handleCaseSelect = (caseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCaseIds(prev => [...prev, caseId]);
    } else {
      setSelectedCaseIds(prev => prev.filter(id => id !== caseId));
    }
  };

  const handleDelete = async () => {
    if (selectedCaseIds.length === 0) return;
    
    const confirmMessage = selectedCaseIds.length === 1 
      ? 'Вы уверены, что хотите удалить выбранный кейс? Это действие необратимо.'
      : `Вы уверены, что хотите удалить ${selectedCaseIds.length} кейсов? Это действие необратимо.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        for (const caseId of selectedCaseIds) {
          await deleteCase(caseId);
        }
        const updatedCases = await getCases(100);
        setCases(updatedCases);
        setSelectedCaseIds([]);
      } catch (error) {
        console.error('Ошибка при удалении:', error);
        alert('Не удалось удалить некоторые кейсы.');
      }
    }
  };

  // Отправить на оценку
  const handleSendToReview = async () => {
    if (selectedCaseIds.length === 0) return;
    
    try {
      for (const caseId of selectedCaseIds) {
        await sendToReview(caseId);
      }
      const updatedCases = await getCases(100);
      setCases(updatedCases);
      setSelectedCaseIds([]);
    } catch (error) {
      console.error('Ошибка при отправке на оценку:', error);
      alert('Не удалось отправить кейсы на оценку.');
    }
  };

  // Одобрить
  const handleApprove = async () => {
    if (selectedCaseIds.length === 0) return;
    
    try {
      for (const caseId of selectedCaseIds) {
        await activateCase(caseId);
      }
      const updatedCases = await getCases(100);
      setCases(updatedCases);
      setSelectedCaseIds([]);
      alert(`Кейсы одобрены и стали активными`);
    } catch (error) {
      console.error('Ошибка при одобрении:', error);
      alert('Не удалось одобрить кейсы.');
    }
  };

  // Отправить на доработку
  const handleSendToRevision = async () => {
    if (selectedCaseIds.length === 0) return;
    
    try {
      for (const caseId of selectedCaseIds) {
        await rejectCase(caseId);
      }
      const updatedCases = await getCases(100);
      setCases(updatedCases);
      setSelectedCaseIds([]);
    } catch (error) {
      console.error('Ошибка при отправке на доработку:', error);
      alert('Не удалось отправить кейсы на доработку.');
    }
  };

  // Архивировать
  const handleArchive = async () => {
    if (selectedCaseIds.length === 0) return;
    
    try {
      for (const caseId of selectedCaseIds) {
        await archiveCase(caseId);
      }
      const updatedCases = await getCases(100);
      setCases(updatedCases);
      setSelectedCaseIds([]);
      alert(`Кейсы архивированы`);
    } catch (error) {
      console.error('Ошибка при архивации:', error);
      alert('Не удалось архивировать кейсы.');
    }
  };

  const handleCreateCase = () => {
    navigate('/cases/create');
  };

  const handleOpenFullCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleComment = (caseId: string) => {
    navigate(`/cases/${caseId}/comments`);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
  ];

  const hasSelectedCases = selectedCaseIds.length > 0;

  if (loading) {
    return (
      <div className="page-wrapper cases-page">
        <Header />
        <div className="loading-container">Загрузка кейсов...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper cases-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="filters-section">
        <div className="filters-header">
          <div className="filters-left">
            <StatusFilter currentStatus={statusFilter} onStatusChange={setStatusFilter} />
          </div>
          <BulkActionsBar
            selectedCount={selectedCaseIds.length}
            onDelete={handleDelete}
            onCreate={handleCreateCase}
          />
        </div>
        
        <div className="filters-actions-row">
          <div className="filters-left-side">
            {availableSemesters.length > 0 && (
              <SemesterFilter
                selectedSemesters={selectedSemesters}
                onSemesterChange={setSelectedSemesters}
                availableSemesters={availableSemesters}
              />
            )}
          </div>
          <div className="filters-right-side">
            {hasSelectedCases && (
              <ActionsDropdown
                availableActions={getAvailableActions.actions}
                isMixed={getAvailableActions.isMixed}
                onSendToReview={handleSendToReview}
                onApprove={handleApprove}
                onSendToRevision={handleSendToRevision}
                onArchive={handleArchive}
              />
            )}
          </div>
        </div>
      </div>

      <div className="cases-wrapper">
        {filteredCases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            type="case"
            id={caseItem.id}
            title={caseItem.title}
            shortTitle={caseItem.short_title || undefined}
            description={caseItem.description || ''}
            status={caseItem.status}
            defaultOpen={false}
            likes={caseItem.likes || 0}
            dislikes={caseItem.dislikes || 0}
            onOpenFull={() => handleOpenFullCase(caseItem.id)}
            onComment={() => handleComment(caseItem.id)}
            showCheckbox={true}
            isSelected={selectedCaseIds.includes(caseItem.id)}
            onSelect={(selected) => handleCaseSelect(caseItem.id, selected)}
          />
        ))}
        {filteredCases.length === 0 && (
          <div className="empty-cases">
            Нет кейсов, соответствующих фильтрам
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesPage;