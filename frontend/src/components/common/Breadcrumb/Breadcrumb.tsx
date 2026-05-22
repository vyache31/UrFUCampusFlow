import { useNavigate } from 'react-router-dom';
import './breadcrumb.css';

interface BreadcrumbProps {
  items: { label: string; path?: string }[];
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const navigate = useNavigate();

  const handleClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <span 
          key={index} 
          onClick={() => handleClick(item.path)}
          style={{ cursor: item.path ? 'pointer' : 'default' }}
        >
          {item.label}
          {index < items.length - 1 && ' / '}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumb;