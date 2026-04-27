import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import StatusFilter from '../../components/cases/CaseFilters/StatusFilter';
import SemesterFilter from '../../components/cases/CaseFilters/SemesterFilter';
import ActionsDropdown from '../../components/sent-cases/ActionsDropdown';
import CaseCard from '../../components/cases/CaseCard/CaseCard';
import { testCases } from '../../data/cases';
import './casesPage.css';

const SentCasesPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('Отправленные кейсы');
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  const availableSemesters = [...new Set(testCases.map(c => c.semester).filter(Boolean))] as string[];

  const filteredCases = testCases.filter(caseItem => {
    if (caseItem.status !== 'Отправлено') return false;
    if (selectedSemesters.length > 0 && !selectedSemesters.includes(caseItem.semester || '')) {
      return false;
    }
    return true;
  });

  const handleCaseSelect = (caseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCaseIds(prev => [...prev, caseId]);
    } else {
      setSelectedCaseIds(prev => prev.filter(id => id !== caseId));
    }
  };

  const handleSendToRevision = () => {
    alert(`Отправить на доработку: ${selectedCaseIds.join(', ')}`);
  };

  const handleActivate = () => {
    alert(`Активировать кейсы: ${selectedCaseIds.join(', ')}`);
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

  return (
    <div className="page-wrapper cases-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="filters-section">
        <div className="filters-header">
          <div className="filters-left">
            <StatusFilter currentStatus={statusFilter} onStatusChange={setStatusFilter} />
          </div>
          <ActionsDropdown
            onSendToRevision={handleSendToRevision}
            onActivate={handleActivate}
          />
        </div>
        <div className="filters-row">
          <SemesterFilter
            selectedSemesters={selectedSemesters}
            onSemesterChange={setSelectedSemesters}
            availableSemesters={availableSemesters}
          />
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
            onOpenFull={() => handleOpenFullCase(caseItem.id)}
            onComment={() => handleComment(caseItem.id)}
            showCheckbox={true}  // ← ПОКАЗЫВАЕМ ЧЕКБОКС
            isSelected={selectedCaseIds.includes(caseItem.id)}
            onSelect={(selected) => handleCaseSelect(caseItem.id, selected)}
          />
        ))}
        {filteredCases.length === 0 && (
          <div className="empty-cases">
            Нет отправленных кейсов
          </div>
        )}
      </div>
    </div>
  );
};

export default SentCasesPage;