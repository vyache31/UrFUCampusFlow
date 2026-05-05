import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import StatusFilter from '../../components/cases/CaseFilters/StatusFilter';
import SemesterFilter from '../../components/cases/CaseFilters/SemesterFilter';
import BulkActionsBar from '../../components/cases/BulkActions/BulkActionsBar';
import ActionsDropdown from '../../components/sent-cases/ActionsDropdown';
import CaseCard from '../../components/cases/CaseCard/CaseCard';
import { getCases, type Case } from '../../services/cases';
import './casesPage.css';

const CasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Все кейсы');
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  // Загрузка кейсов из API
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await getCases();
        setCases(data);
      } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Доступные семестры из реальных данных
  const availableSemesters = useMemo(() => {
    const semesters = [...new Set(cases.map(c => c.semester).filter(Boolean))] as string[];
    return semesters;
  }, [cases]);

  const getStatusForFilter = (status: string) => {
    if (status === 'Активные кейсы') return 'Активный';
    if (status === 'Отправленные кейсы') return 'Отправлено';
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
  const allSelectedAreSent = useMemo(() => {
    if (selectedCaseIds.length === 0) return false;
    return selectedCases.every(c => c.status === 'Отправлено');
  }, [selectedCaseIds, selectedCases]);

  const handleCaseSelect = (caseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCaseIds(prev => [...prev, caseId]);
    } else {
      setSelectedCaseIds(prev => prev.filter(id => id !== caseId));
    }
  };

  const handleDelete = () => {
    console.log(`Удалить кейсы: ${selectedCaseIds.join(', ')}`);
    // TODO: вызвать API удаления
  };

  const handleMarkActive = () => {
    console.log(`Активировать кейсы: ${selectedCaseIds.join(', ')}`);
    // TODO: вызвать API активации
  };

  const handleSendToRevision = () => {
    console.log(`Отправить на доработку: ${selectedCaseIds.join(', ')}`);
    // TODO: вызвать API отправки на доработку
  };

  const handleActivate = () => {
    console.log(`Активировать кейсы: ${selectedCaseIds.join(', ')}`);
    // TODO: вызвать API активации
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
            onMarkActive={handleMarkActive}
            onCreate={handleCreateCase}
          />
        </div>
        <div className="filters-row">
          {availableSemesters.length > 0 && (
            <SemesterFilter
              selectedSemesters={selectedSemesters}
              onSemesterChange={setSelectedSemesters}
              availableSemesters={availableSemesters}
            />
          )}
          {hasSelectedCases && allSelectedAreSent && (
            <ActionsDropdown
              onSendToRevision={handleSendToRevision}
              onActivate={handleActivate}
            />
          )}
        </div>
      </div>

      <div className="cases-wrapper">
        {filteredCases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            type="case"
            id={caseItem.id}
            title={caseItem.title}
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