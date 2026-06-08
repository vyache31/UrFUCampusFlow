import './GenerationLoader.css';

const GenerationLoader = () => {
  return (
    <div className="generation-overlay">
      <div className="generation-content">
        <div className="generation-stars">
          <span className="star">✦</span>
          <span className="star">✦</span>
          <span className="star">✦</span>
          <span className="star">✦</span>
          <span className="star">✦</span>
        </div>
        <div className="generation-title">ИИ генерация</div>
        <div className="generation-text">Генерация кейса...</div>
        <div className="generation-hint">Это может занять несколько секунд</div>
      </div>
    </div>
  );
};

export default GenerationLoader;