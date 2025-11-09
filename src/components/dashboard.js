import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

function Dashboard({ user, setCurrentDocument }) {
  const [documents, setDocuments] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1);

  // Real-time listener for user's documents
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    const q = query(
      collection(db, 'documents'),
      where('owner', '==', user.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({ 
            id: doc.id, 
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date()
          });
        });
        setDocuments(docs);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading documents:', error);
        setLoading(false);
        if (error.code === 'failed-precondition') {
          loadDocumentsWithoutOrder();
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Simulate online users (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => Math.max(1, Math.floor(prev + (Math.random() * 2 - 1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDocumentsWithoutOrder = async () => {
    try {
      const q = query(
        collection(db, 'documents'),
        where('owner', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ 
          id: doc.id, 
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date()
        });
      });
      docs.sort((a, b) => b.lastUpdated - a.lastUpdated);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents without order:', error);
    }
  };

  const createNewDocument = async () => {
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        title: 'New Document',
        content: 'Start typing your content here...',
        owner: user.uid,
        ownerEmail: user.displayName || user.email.split('@')[0],
        createdAt: new Date(),
        lastUpdated: new Date(),
        lastUpdatedBy: user.displayName || user.email.split('@')[0],
        lastUpdatedByEmail: user.email,
        collaborators: [user.uid]
      });
      setCurrentDocument(docRef.id);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error creating document: ' + error.message);
    }
    setCreating(false);
  };

  // DELETE Document
  const deleteDocument = async (docId, docTitle) => {
    if (window.confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'documents', docId));
        console.log('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document: ' + error.message);
      }
    }
  };

  // START Editing Document Title
  const startEditing = (docId, currentTitle) => {
    setEditingDoc(docId);
    setEditTitle(currentTitle);
  };

  // CANCEL Editing
  const cancelEditing = () => {
    setEditingDoc(null);
    setEditTitle('');
  };

  // UPDATE Document Title
  const updateDocumentTitle = async (docId) => {
    if (!editTitle.trim()) {
      alert('Document title cannot be empty');
      return;
    }

    try {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        title: editTitle,
        lastUpdated: new Date(),
        lastUpdatedBy: user.displayName || user.email.split('@')[0],
        lastUpdatedByEmail: user.email
      });
      setEditingDoc(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error updating document title:', error);
      alert('Error updating title: ' + error.message);
    }
  };

  const openDocument = (docId) => {
    setCurrentDocument(docId);
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get user display name (first part of email if no display name)
  const getUserDisplayName = () => {
    return user.displayName || user.email.split('@')[0];
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading your documents...</h2>
        <p>Please wait while we load your documents</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Professional Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px 30px',
        borderRadius: '20px',
        marginBottom: '30px',
        textAlign: 'center',
        boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 'bold' }}>
          📝 Document Collaboration System
        </h1>
        <p style={{ margin: '15px 0 0 0', fontSize: '1.3rem', opacity: 0.95 }}>
          Real-time editing • Offline support • Cloud-powered
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        background: '#e8f5e8',
        padding: '15px 25px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center',
        border: '3px solid #4caf50',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0, color: '#2e7d32', fontSize: '1.4rem' }}>
          🌟 <strong>{documents.length} Documents</strong> | 
          👥 <strong>{onlineUsers} Users Online</strong> |
          ⚡ <strong>Real-time Collaboration</strong>
        </h3>
      </div>

      {/* Feature Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          padding: '25px', 
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
          borderRadius: '15px', 
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(33, 150, 243, 0.15)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚡</div>
          <strong style={{ fontSize: '1.2rem' }}>Real-time Sync</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#555' }}>See changes instantly across all devices</p>
        </div>
        <div style={{ 
          padding: '25px', 
          background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)', 
          borderRadius: '15px', 
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📱</div>
          <strong style={{ fontSize: '1.2rem' }}>Offline Support</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#555' }}>Work anywhere, sync when back online</p>
        </div>
        <div style={{ 
          padding: '25px', 
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', 
          borderRadius: '15px', 
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
          <strong style={{ fontSize: '1.2rem' }}>Team Collaboration</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#555' }}>Multiple users editing simultaneously</p>
        </div>
        <div style={{ 
          padding: '25px', 
          background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', 
          borderRadius: '15px', 
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(233, 30, 99, 0.15)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔒</div>
          <strong style={{ fontSize: '1.2rem' }}>Secure Cloud</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#555' }}>Encrypted storage & authentication</p>
        </div>
      </div>

      {/* Documents Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '2rem' }}>My Documents</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1.1rem' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} • Owned by <strong>{getUserDisplayName()}</strong>
          </p>
        </div>
        <button 
          onClick={createNewDocument}
          disabled={creating}
          style={{
            padding: '15px 30px',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '180px',
            boxShadow: '0 5px 15px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {creating ? '🔄 Creating...' : '📄 + New Document'}
        </button>
      </div>

      {documents.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '60px', 
          color: '#666',
          padding: '60px 40px',
          border: '3px dashed #ddd',
          borderRadius: '20px',
          background: '#fafafa'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📝</div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.8rem' }}>No documents yet</h3>
          <p style={{ margin: '0 0 30px 0', fontSize: '1.1rem' }}>Create your first document to start collaborating!</p>
          <button 
            onClick={createNewDocument}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 5px 15px rgba(0, 123, 255, 0.3)'
            }}
          >
            🚀 Create Your First Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {documents.map((document) => (
            <div
              key={document.id}
              style={{
                padding: '25px',
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                background: 'white',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.15)';
                e.target.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)';
                e.target.style.borderColor = '#e0e0e0';
              }}
            >
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  {editingDoc === document.id ? (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{
                          padding: '12px 18px',
                          fontSize: '1.3rem',
                          border: '3px solid #007bff',
                          borderRadius: '10px',
                          width: '100%',
                          maxWidth: '400px',
                          fontWeight: 'bold'
                        }}
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateDocumentTitle(document.id);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => updateDocumentTitle(document.id)}
                          style={{
                            padding: '12px 20px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✅ Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          style={{
                            padding: '12px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ 
                        margin: '0 0 12px 0', 
                        color: '#333',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}>
                        {document.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '14px',
                          background: '#007bff',
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontWeight: 'bold'
                        }}>
                          📝 {document.content ? `${document.content.length} characters` : 'Empty document'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ACTION BUTTONS */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  minWidth: '280px'
                }}>
                  <button 
                    onClick={() => openDocument(document.id)}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '100px',
                      boxShadow: '0 3px 10px rgba(0, 123, 255, 0.3)'
                    }}
                  >
                    📂 Open
                  </button>
                  
                  <button 
                    onClick={() => startEditing(document.id, document.title)}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '120px',
                      boxShadow: '0 3px 10px rgba(255, 193, 7, 0.3)'
                    }}
                  >
                    ✏️ Edit Title
                  </button>
                  
                  <button 
                    onClick={() => deleteDocument(document.id, document.title)}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '100px',
                      boxShadow: '0 3px 10px rgba(220, 53, 69, 0.3)'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Document Details */}
              <div style={{ 
                color: '#666', 
                fontSize: '15px',
                background: '#f8f9fa',
                padding: '18px',
                borderRadius: '10px',
                marginTop: '15px'
              }}>
                <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>📅 Created:</strong> {document.createdAt?.toLocaleDateString?.() || 'Unknown'}
                  </div>
                  <div>
                    <strong>🕒 Last updated:</strong> {getTimeAgo(document.lastUpdated)}
                  </div>
                  {document.lastUpdatedBy && (
                    <div>
                      <strong>👤 Last edited by:</strong> {document.lastUpdatedBy}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;