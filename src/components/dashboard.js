import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import DocumentEditor from './DocumentEditor';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Real-time listener for ALL documents (not just user's)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Show ALL documents (no owner filter)
    const q = query(
      collection(db, 'documents'),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({ 
            id: doc.id, 
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date(),
            isOwner: doc.data().owner === user.email // Check by email instead of UID
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

  const loadDocumentsWithoutOrder = async () => {
    try {
      const q = query(collection(db, 'documents'));
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ 
          id: doc.id, 
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date(),
          isOwner: doc.data().owner === user.email
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
        owner: user.email, // Store EMAIL instead of UID
        ownerName: user.displayName,
        ownerEmail: user.email,
        createdAt: new Date(),
        lastUpdated: new Date(),
        lastUpdatedBy: user.displayName,
        lastUpdatedByEmail: user.email,
        collaborators: [user.email], // Store emails instead of UIDs
        isPublic: true
      });
      
      // Open the newly created document
      const newDoc = { 
        id: docRef.id, 
        title: 'New Document',
        owner: user.email,
        isOwner: true
      };
      setSelectedDoc(newDoc);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error creating document: ' + error.message);
    }
    setCreating(false);
  };

  // DELETE Document - Only if owner
  const deleteDocument = async (docId, docTitle, isOwner) => {
    if (!isOwner) {
      alert('You can only delete documents you created.');
      return;
    }

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

  // START Editing Document Title - Only if owner
  const startEditing = (docId, currentTitle, isOwner) => {
    if (!isOwner) {
      alert('You can only edit titles of documents you created.');
      return;
    }
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
        lastUpdatedBy: user.displayName,
        lastUpdatedByEmail: user.email
      });
      setEditingDoc(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error updating document title:', error);
      alert('Error updating title: ' + error.message);
    }
  };

  const openDocument = (document) => {
    setSelectedDoc(document);
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading documents...</h2>
        <p>Please wait while we load all documents</p>
      </div>
    );
  }

  // If a document is selected, show DocumentEditor
  if (selectedDoc) {
    return (
      <DocumentEditor 
        document={selectedDoc} 
        user={user}
        onBack={() => setSelectedDoc(null)}
      />
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Document Collaboration System</h1>
        <div className="user-info">
          <span>Welcome, {user.displayName}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Stats Bar */}
        <div className="stats-bar">
          <h3>
            🌟 <strong>{documents.length} Shared Documents</strong> | 
            👤 <strong>Welcome, {user.displayName}</strong> |
            ⚡ <strong>Real-time Collaboration</strong>
          </h3>
        </div>

        {/* Documents Header */}
        <div className="documents-header">
          <div>
            <h1>Shared Documents</h1>
            <p>
              {documents.length} document{documents.length !== 1 ? 's' : ''} • All users can view and collaborate
            </p>
          </div>
          <button 
            onClick={createNewDocument}
            disabled={creating}
            className="create-doc-btn"
          >
            {creating ? '🔄 Creating...' : '📄 + New Document'}
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No documents yet</h3>
            <p>Create the first document to start collaborating!</p>
            <button 
              onClick={createNewDocument}
              className="create-first-btn"
            >
              🚀 Create First Document
            </button>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`document-card ${document.isOwner ? 'owner-document' : ''}`}
              >
                {/* Document Header */}
                <div className="document-header">
                  <div className="document-info">
                    {editingDoc === document.id ? (
                      <div className="edit-title-container">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="title-edit-input"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateDocumentTitle(document.id);
                            }
                          }}
                        />
                        <div className="edit-actions">
                          <button 
                            onClick={() => updateDocumentTitle(document.id)}
                            className="save-btn"
                          >
                            ✅ Save
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="cancel-btn"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3>
                          {document.title}
                          {document.isOwner && (
                            <span className="owner-badge">
                              👑 Your Document
                            </span>
                          )}
                        </h3>
                        <div className="document-stats">
                          <span className="stat-badge">
                            📝 {document.content ? `${document.content.length} characters` : 'Empty document'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* ACTION BUTTONS */}
                  <div className="document-actions">
                    <button 
                      onClick={() => openDocument(document)}
                      className="open-btn"
                    >
                      📂 Open
                    </button>
                    
                    {document.isOwner && (
                      <>
                        <button 
                          onClick={() => startEditing(document.id, document.title, document.isOwner)}
                          className="edit-btn"
                        >
                          ✏️ Edit Title
                        </button>
                        
                        <button 
                          onClick={() => deleteDocument(document.id, document.title, document.isOwner)}
                          className="delete-btn"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Document Details */}
                <div className="document-details">
                  <div className="details-grid">
                    <div>
                      <strong>👤 Created by:</strong> {document.ownerName || 'Unknown'}
                    </div>
                    <div>
                      <strong>📅 Created:</strong> {document.createdAt?.toLocaleDateString?.() || 'Unknown'}
                    </div>
                    <div>
                      <strong>🕒 Last updated:</strong> {getTimeAgo(document.lastUpdated)}
                    </div>
                    {document.lastUpdatedBy && (
                      <div>
                        <strong>✍️ Last edited by:</strong> {document.lastUpdatedBy}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;