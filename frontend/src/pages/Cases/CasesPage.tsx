import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import StatusFilter from '../../components/cases/CaseFilters/StatusFilter';
import SemesterFilter from '../../components/cases/CaseFilters/SemesterFilter';
import BulkActionsBar from '../../components/cases/BulkActions/BulkActionsBar';
import ActionsDropdown from '../../components/sent-cases/ActionsDropdown';
import CaseCard from '../../components/cases/CaseCard/CaseCard';
import { testCases } from '../../data/cases';
import './casesPage.css';

const CasesPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('Все кейсы');
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  const availableSemesters = [...new Set(testCases.map(c => c.semester).filter(Boolean))] as string[];

  const getStatusForFilter = (status: string) => {
    if (status === 'Активные кейсы') return 'Активный';
    if (status === 'Отправленные кейсы') return 'Отправлено';
    return status;
  };

  const filteredCases = testCases.filter(caseItem => {
    if (statusFilter !== 'Все кейсы') {
      const filterStatus = getStatusForFilter(statusFilter);
      if (caseItem.status !== filterStatus) return false;
    }
    if (selectedSemesters.length > 0 && !selectedSemesters.includes(caseItem.semester || '')) {
      return false;
    }
    return true;
  });

  const selectedCases = testCases.filter(c => selectedCaseIds.includes(c.id));
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
    alert(`Удалить кейсы: ${selectedCaseIds.join(', ')}`);
  };

  const handleMarkActive = () => {
    alert(`Активировать кейсы: ${selectedCaseIds.join(', ')}`);
  };

  const handleSendToRevision = () => {
    alert(`Отправить на доработку: ${selectedCaseIds.join(', ')}`);
  };

  const handleActivate = () => {
    alert(`Активировать кейсы: ${selectedCaseIds.join(', ')}`);
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
          <SemesterFilter
            selectedSemesters={selectedSemesters}
            onSemesterChange={setSelectedSemesters}
            availableSemesters={availableSemesters}
          />
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
            title={caseItem.title}
            description={caseItem.description}
            status={caseItem.status}
            defaultOpen={false}
            likes={caseItem.likes}
            dislikes={caseItem.dislikes}
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