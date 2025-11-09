import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/login.js';
import Dashboard from './components/dashboard.js';
import DocumentEditor from './components/DocumentEditor.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDocument, setCurrentDocument] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setCurrentDocument(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="App">
      <header style={{ 
        padding: '15px 20px', 
        background: '#f8f9fa', 
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
            {currentDocument ? 'Editing Document' : 'Document Collaboration'}
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Welcome, {user.email}
          </p>
        </div>
        
        <div>
          {currentDocument && (
            <button 
              onClick={() => setCurrentDocument(null)}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              ← Back to Documents
            </button>
          )}
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main>
        {currentDocument ? (
          <DocumentEditor 
            documentId={currentDocument} 
            user={user} 
          />
        ) : (
          <Dashboard 
            user={user} 
            setCurrentDocument={setCurrentDocument} 
          />
        )}
      </main>
    </div>
  );
}

export default App;