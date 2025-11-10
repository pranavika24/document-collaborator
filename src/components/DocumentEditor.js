import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, getDocs } from 'firebase/firestore';
import emailjs from 'emailjs-com';
import './DocumentEditor.css';

// EmailJS Configuration - Replace with your actual values
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_1kkja17',
  TEMPLATE_ID: 'template_hv4kzj9', 
  PUBLIC_KEY: 'dUCnbyzV1LxxOFIKQ'
};

function DocumentEditor({ document, user, onBack }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [collaborators, setCollaborators] = useState([]);
  const [emailEnabled, setEmailEnabled] = useState(false);

  // Initialize EmailJS
  useEffect(() => {
    if (EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.PUBLIC_KEY !== 'dUCnbyzV1LxxOFIKQ') {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      setEmailEnabled(true);
      console.log('✅ EmailJS initialized');
    } else {
      console.log('❌ Please configure EmailJS with your actual credentials');
    }
  }, []);

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load document data
  useEffect(() => {
    if (!document?.id) return;

    const docRef = doc(db, 'documents', document.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent(data.content || '');
        setTitle(data.title || data.name || 'Untitled Document');
        
        // Load collaborators from THIS document only
        if (data.collaborators && Array.isArray(data.collaborators)) {
          const docCollaborators = data.collaborators
            .filter(email => email && email !== user.email)
            .map(email => ({
              email: email,
              name: email.split('@')[0]
            }));
          setCollaborators(docCollaborators);
        }
      }
    });

    return () => unsubscribe();
  }, [document, user.email]);

  // Send email notification via EmailJS
  const sendEmailNotification = async (action) => {
    if (!emailEnabled || collaborators.length === 0) {
      console.log('Email notifications disabled or no collaborators');
      return;
    }

    try {
      console.log(`📧 Sending notifications to ${collaborators.length} collaborators`);

      for (const collaborator of collaborators) {
        const templateParams = {
          to_name: collaborator.name,
          to_email: collaborator.email,
          document_title: title,
          action: action,
          updated_by: user.displayName,
          updated_by_email: user.email,
          timestamp: new Date().toLocaleString(),
          document_link: window.location.href
        };

        await emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_ID,
          templateParams
        );
        
        console.log(`✅ Notification sent to: ${collaborator.email}`);
      }
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
    }
  };

  // Save document
  const saveDocument = async (sendNotification = false, action = 'updated the document') => {
    if (!document?.id) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        content: content,
        title: title,
        lastModified: new Date(),
        lastUpdatedBy: user.displayName,
        lastUpdatedByEmail: user.email
      });
      setLastSaved(new Date());
      console.log('💾 Document saved!');

      // Send email notification if requested
      if (sendNotification && emailEnabled && collaborators.length > 0) {
        await sendEmailNotification(action);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
    setSaving(false);
  };

  // Auto-save without notifications
  useEffect(() => {
    if (content && document?.id) {
      const timer = setTimeout(() => {
        saveDocument(false, 'auto-save');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [content, title, document]);

  // Manual save with notification
  const handleManualSave = async () => {
    await saveDocument(true, 'made significant updates');
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload PDF, Word, Image, or Text files only.');
      return;
    }

    if (fileExtension === '.txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = `\n\n--- 📄 Uploaded File: ${file.name} ---\n${e.target.result}\n--- End of ${file.name} ---\n\n`;
        setContent(prevContent => prevContent + fileContent);
        setTimeout(() => {
          saveDocument(true, `uploaded file: ${file.name}`);
        }, 1000);
      };
      reader.readAsText(file);
    } else {
      const fileReference = `\n\n--- 📎 Uploaded File: ${file.name} (${(file.size / 1024).toFixed(2)} KB) ---\n[File uploaded: ${file.name}]\n--- End of ${file.name} ---\n\n`;
      setContent(prevContent => prevContent + fileReference);
      setTimeout(() => {
        saveDocument(true, `uploaded file: ${file.name}`);
      }, 1000);
    }

    event.target.value = '';
  };

  return (
    <div className="document-editor">
      <header className="editor-header">
        <button onClick={onBack} className="back-button">← Back to Documents</button>
        <div className="header-content">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Document Title"
          />
          <div className="editor-info">
            <span>👤 Editing as: <strong>{user.displayName}</strong></span>
            <span className={`status ${saving ? 'saving' : isOnline ? 'saved' : 'offline'}`}>
              {saving ? '💾 Saving...' : isOnline ? '✅ All changes saved' : '📱 Offline editing'}
            </span>
            {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
          </div>
        </div>
      </header>

      <div className="editor-content">
        <div className="sidebar">
          <div className="collaborators-section">
            <h4>👥 Collaborators ({collaborators.length})</h4>
            <div className="collaborators-list">
              {collaborators.length > 0 ? (
                collaborators.map((collab, index) => (
                  <div key={index} className="collaborator-item">
                    <div className="collaborator-name">{collab.name}</div>
                    <div className="collaborator-email">{collab.email}</div>
                  </div>
                ))
              ) : (
                <p className="no-collaborators">No other collaborators yet</p>
              )}
            </div>
          </div>

          <div className="actions-section">
            <h4>📧 Email Notifications</h4>
            {emailEnabled ? (
              <div className="notification-status">
                <p>✅ EmailJS Active</p>
                <p>{collaborators.length} collaborator(s) will be notified</p>
                <button 
                  onClick={handleManualSave}
                  disabled={saving}
                  className="notify-button"
                >
                  {saving ? 'Saving...' : '💾 Save & Notify All'}
                </button>
              </div>
            ) : (
              <div className="notification-setup">
                <p>🔧 Set up EmailJS</p>
                <small>Get free account at emailjs.com</small>
                <small>Replace credentials in DocumentEditor.js</small>
              </div>
            )}
          </div>

          <div className="upload-section">
            <h4>📎 Upload File</h4>
            <input
              type="file"
              id="fileUpload"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png"
            />
            <label htmlFor="fileUpload" className="upload-button">
              Choose File
            </label>
            <small>Supports: PDF, Word, Text, Images</small>
          </div>
        </div>

        <div className="editor-main">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your document here... Your changes are saved automatically!"
            className="editor-textarea"
          />
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;