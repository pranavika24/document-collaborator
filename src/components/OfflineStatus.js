import React, { useState, useEffect } from 'react';

function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Connection restored - Syncing changes...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('⚠️ You are offline - Changes will sync when connection returns');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '10px',
      zIndex: 1000,
      boxShadow: '0 5px 20px rgba(255, 152, 0, 0.3)',
      fontSize: '14px',
      fontWeight: 'bold',
      animation: 'pulse 2s infinite'
    }}>
      ⚠️ You are offline - Changes saved locally
    </div>
  );
}

export default OfflineStatus;