import { useNavigate } from 'react-router-dom';
import CaseCard from '../cases/CaseCard/CaseCard';
import './previewSection.css';

interface PreviewItem {
  id: string;
  title?: string;
  name?: string;
  short_title?: string | null;
  description?: string;
  project_goals?: string;
  status?: string;
  status_name?: string;
}

interface PreviewSectionProps {
  title: string;
  items: PreviewItem[];
  type: 'case' | 'team';
  allRoute: string;
  allLabel: string;
}

const PreviewSection = ({ title, items, type, allRoute, allLabel }: PreviewSectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
      </div>

      {items.map(item => (
        <CaseCard
          key={item.id}
          type={type}
          id={item.id}
          title={type === 'case' ? item.title ?? '' : item.name ?? ''}
          shortTitle={type === 'case' ? item.short_title || item.title : undefined}
          description={
            type === 'case'
              ? item.project_goals || ''
              : item.description || ''
          }
          status={
            type === 'case'
              ? item.status_name || 'На оценке'
              : item.status ?? ''
          }
        />
      ))}

      <button className="view-all-btn" onClick={() => navigate(allRoute)}>
        {allLabel}
      </button>
    </section>
  );
};

export default PreviewSection;