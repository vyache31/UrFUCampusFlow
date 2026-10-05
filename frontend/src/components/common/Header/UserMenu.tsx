interface UserMenuProps {
  displayName: string;
  fullText: string;
  isAuthenticated: boolean;
  isOpen: boolean;
  isCheckingOutlook: boolean;
  isOutlookConnected: boolean;
  onToggle: () => void;
  onConnectOutlook: () => void;
  onDisconnectOutlook: () => void;
  onLogout: () => void;
}

const UserMenu = ({
  displayName,
  fullText,
  isAuthenticated,
  isOpen,
  isCheckingOutlook,
  isOutlookConnected,
  onToggle,
  onConnectOutlook,
  onDisconnectOutlook,
  onLogout,
}: UserMenuProps) => (
  <div className="user-menu-wrapper">
    <div
      className={`user-name ${isAuthenticated ? '' : 'guest'}`}
      onClick={onToggle}
      title={isAuthenticated ? fullText : ''}
    >
      {displayName}
    </div>

    {isAuthenticated && (
      <div className={`user-dropdown ${isOpen ? 'open' : ''}`}>
        {!isCheckingOutlook && !isOutlookConnected && (
          <button className="dropdown-item" onClick={onConnectOutlook}>
            Связать с Outlook
          </button>
        )}
        {!isCheckingOutlook && isOutlookConnected && (
          <button className="dropdown-item" onClick={onDisconnectOutlook}>
            Отвязать Outlook
          </button>
        )}
        <button className="dropdown-item" onClick={onLogout}>
          Выйти
        </button>
      </div>
    )}
  </div>
);

export default UserMenu;