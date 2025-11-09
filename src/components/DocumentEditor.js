import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

function DocumentEditor({ documentId, user }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [saving, setSaving] = useState(false);

  // Real-time listener for document changes
  useEffect(() => {
    if (!documentId) return;

    const docRef = doc(db, 'documents', documentId);
    
    // Real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent(data.content || '');
        setTitle(data.title || 'Untitled Document');
      }
    });

    return () => unsubscribe();
  }, [documentId]);

  // Save document content
  const saveDocument = async () => {
    if (!documentId) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        content: content,
        title: title,
        lastUpdated: new Date(),
        lastUpdatedBy: user.email
      });
      console.log('Document saved!');
    } catch (error) {
      console.error('Error saving document:', error);
    }
    setSaving(false);
  };

  // Auto-save when content changes (with debounce)
  useEffect(() => {
    if (content) {
      const timer = setTimeout(() => {
        saveDocument();
      }, 2000); // Save after 2 seconds of no typing
      return () => clearTimeout(timer);
    }
  }, [content]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '24px', 
            border: 'none',
            borderBottom: '2px solid #007bff',
            marginBottom: '10px'
          }}
          placeholder="Document Title"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Editing as: {user.email}
          </span>
          <span style={{ color: saving ? '#ff9800' : '#4caf50', fontSize: '14px' }}>
            {saving ? 'Saving...' : 'All changes saved'}
          </span>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your document here..."
        style={{
          width: '100%',
          height: '500px',
          padding: '20px',
          fontSize: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          resize: 'vertical',
          fontFamily: 'Arial, sans-serif'
        }}
      />

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={saveDocument}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Document'}
        </button>
      </div>
    </div>
  );
}

export default DocumentEditor;