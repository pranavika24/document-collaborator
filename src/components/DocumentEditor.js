import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

function DocumentEditor({ documentId, user }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeUsers, setActiveUsers] = useState([]);

  // Network status
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

  // Real-time listener for document changes - FIXED VERSION
  useEffect(() => {
    if (!documentId) return;

    const docRef = doc(db, 'documents', documentId);
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only update if content is different to avoid cursor jumping
          if (data.content !== content) {
            setContent(data.content || '');
          }
          if (data.title !== title) {
            setTitle(data.title || 'Untitled Document');
          }
        }
      },
      (error) => {
        if (error.code === 'unavailable') {
          console.log('📱 Offline - Using cached data');
        } else {
          console.error('Error in document listener:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [documentId]); // Removed content and title dependencies

  // Track active users in this document
  useEffect(() => {
    if (!documentId || !user) return;

    const userActivityRef = doc(db, 'activeUsers', documentId);
    
    // Add current user to active users
    const userData = {
      userId: user.uid,
      userName: user.displayName || user.email.split('@')[0],
      userEmail: user.email,
      lastActive: new Date(),
      isActive: true
    };

    // This would require a different Firebase structure for real active users
    // For now, we'll simulate it for demo
    const demoUsers = [
      { userName: 'You', lastAction: 'Editing now', isOnline: true },
      { userName: 'Alex', lastAction: 'Viewing document', isOnline: true },
      { userName: 'Sam', lastAction: 'Updated 2 min ago', isOnline: false }
    ];
    
    setActiveUsers(demoUsers);

  }, [documentId, user]);

  // Save document content - IMPROVED VERSION
  const saveDocument = async (manualSave = false) => {
    if (!documentId) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        content: content,
        title: title,
        lastUpdated: new Date(),
        lastUpdatedBy: user.displayName || user.email.split('@')[0],
        lastUpdatedByEmail: user.email
      });
      setLastSaved(new Date());
      console.log('💾 Document saved!');
    } catch (error) {
      if (error.code === 'unavailable') {
        console.log('📱 Offline - Changes saved locally, will sync when online');
        setLastSaved(new Date());
      } else {
        console.error('Error saving document:', error);
      }
    }
    setSaving(false);
  };

  // Auto-save when content changes - IMPROVED
  useEffect(() => {
    if (content && documentId) {
      const timer = setTimeout(() => {
        saveDocument();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, title, documentId]); // Added documentId dependency

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload PDF, Word, or Text files only.');
      return;
    }

    // For demo purposes - in real app, you'd upload to Firebase Storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = `\n\n--- Uploaded File: ${file.name} ---\n[File content would be processed here]\n--- End of ${file.name} ---\n\n`;
      setContent(prevContent => prevContent + fileContent);
      alert(`📎 ${file.name} uploaded successfully! (Demo: File content would be processed in full version)`);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Collaboration Status Bar */}
      <div style={{
        background: isOnline ? '#e8f5e8' : '#fff3cd',
        border: `2px solid ${isOnline ? '#4caf50' : '#ff9800'}`,
        padding: '15px 20px',
        borderRadius: '12px',
        marginBottom: '25px',
        color: isOnline ? '#2e7d32' : '#856404'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>
              {isOnline ? '✅ Online - Real-time collaboration active' : '⚠️ Offline - Editing locally'}
            </strong>
            {isOnline && (
              <span style={{ marginLeft: '15px', fontSize: '14px' }}>
                👥 <strong>{activeUsers.filter(u => u.isOnline).length} users active</strong>
              </span>
            )}
          </div>
          <div style={{ fontSize: '14px' }}>
            {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {/* Active Users Sidebar */}
      {isOnline && (
        <div style={{
          background: 'white',
          border: '2px solid #007bff',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>👥 Active Collaborators</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            {activeUsers.map((user, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                background: user.isOnline ? '#f0f8ff' : '#f8f9fa',
                borderRadius: '6px',
                borderLeft: `4px solid ${user.isOnline ? '#28a745' : '#6c757d'}`
              }}>
                <div>
                  <strong>{user.userName}</strong>
                  {user.userName === 'You' && ' (You)'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: user.isOnline ? '#28a745' : '#6c757d'
                }}>
                  {user.isOnline ? '🟢 Online' : '⚫ Offline'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Header */}
      <div style={{ 
        marginBottom: '25px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '15px', 
            fontSize: '28px', 
            border: 'none',
            borderBottom: `3px solid ${isOnline ? '#007bff' : '#ff9800'}`,
            marginBottom: '15px',
            background: 'transparent',
            fontWeight: 'bold',
            color: '#333'
          }}
          placeholder="Document Title"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <span style={{ color: '#666', fontSize: '15px' }}>
            👤 Editing as: <strong>{user.displayName || user.email.split('@')[0]}</strong>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ 
              color: saving ? '#ff9800' : isOnline ? '#4caf50' : '#ff9800', 
              fontSize: '15px',
              fontWeight: 'bold',
              background: saving ? '#fff3cd' : isOnline ? '#e8f5e8' : '#fff3cd',
              padding: '8px 15px',
              borderRadius: '20px'
            }}>
              {saving ? '💾 Saving...' : isOnline ? '✅ All changes saved' : '📱 Saving locally...'}
            </span>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>📎 Upload Files</h4>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            id="fileUpload"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />
          <label htmlFor="fileUpload" style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            border: '2px dashed white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            📄 Choose PDF/Word File
          </label>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            Supports: PDF, Word (.doc, .docx), Text files
          </span>
        </div>
      </div>

      {/* Editor */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your document here... Your changes are saved automatically and visible to others in real-time! 

💡 Demo Tips:
• Type something - others will see it instantly
• Turn off WiFi to test offline mode  
• Upload files using the button above
• See who's online in the active users list"
          style={{
            width: '100%',
            height: '500px',
            padding: '25px',
            fontSize: '16px',
            border: 'none',
            resize: 'vertical',
            fontFamily: 'Arial, sans-serif',
            background: isOnline ? 'white' : '#fffaf0',
            lineHeight: '1.6'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ 
        textAlign: 'center',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => saveDocument(true)}
          style={{
            padding: '15px 30px',
            background: isOnline ? 
              'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : 
              'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '150px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
          }}
        >
          {saving ? '💾 Saving...' : isOnline ? '💾 Save Now' : '📱 Save Locally'}
        </button>

        <button 
          onClick={() => window.print()}
          style={{
            padding: '15px 30px',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '150px'
          }}
        >
          🖨️ Print Document
        </button>
      </div>
    </div>
  );
}

export default DocumentEditor;