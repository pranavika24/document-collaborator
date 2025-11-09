import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

function Dashboard({ user, setCurrentDocument }) {
  const [documents, setDocuments] = useState([]);
  const [creating, setCreating] = useState(false);

  // Load user's documents
  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    try {
      const q = query(
        collection(db, 'documents'),
        where('owner', '==', user.uid),
        orderBy('lastUpdated', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const createNewDocument = async () => {
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        title: 'New Document',
        content: '',
        owner: user.uid,
        ownerEmail: user.email,
        createdAt: new Date(),
        lastUpdated: new Date(),
        collaborators: [user.uid]
      });
      setCurrentDocument(docRef.id);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error creating document: ' + error.message);
    }
    setCreating(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>My Documents</h1>
        <button 
          onClick={createNewDocument}
          disabled={creating}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {creating ? 'Creating...' : '+ New Document'}
        </button>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
          <h3>No documents yet</h3>
          <p>Create your first document to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setCurrentDocument(doc.id)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{doc.title}</h3>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                Last updated: {doc.lastUpdated?.toDate().toLocaleString()}
              </p>
              {doc.lastUpdatedBy && (
                <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '12px' }}>
                  Last edited by: {doc.lastUpdatedBy}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;