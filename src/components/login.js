import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in!');
      } else {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: userName
        });
        console.log('User created with name:', userName);
      }
    } catch (error) {
      console.error('Error:', error.message);
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Left Side - Login Form */}
        <div style={{
          flex: 1,
          padding: '50px',
          background: 'white'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              margin: '0 0 10px 0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              📝 DocCollab
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem', margin: 0 }}>
              {isLogin ? 'Welcome back!' : 'Join our collaboration platform'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease'
                  }}
                  required
                />
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? '🔄 Processing...' : (isLogin ? '🔐 Login' : '🚀 Create Account')}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                width: '100%',
                padding: '15px',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isLogin ? '📝 Need an account? Sign up' : '🔐 Have an account? Login'}
            </button>
          </form>
        </div>

        {/* Right Side - Project Guide */}
        <div style={{
          flex: 1,
          padding: '50px',
          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ 
            margin: '0 0 30px 0', 
            fontSize: '2rem',
            textAlign: 'center'
          }}>
            🎯 Project Guide
          </h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>📋 About This Project</h3>
            <p style={{ margin: '0 0 20px 0', lineHeight: '1.6', opacity: 0.9 }}>
              A Cloud-Based Document Collaboration System that enables real-time editing with offline support. Built with React and Firebase.
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🚀 Demo Steps</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>1</div>
                <span>Create account with your name</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>2</div>
                <span>Create or open a document</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>3</div>
                <span>Test real-time collaboration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>4</div>
                <span>Try offline functionality</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>5</div>
                <span>Upload files and explore features</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>👥 Team Members</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px',
              fontSize: '14px'
            }}>
              <div>• NAVYA.P</div>
              <div>• NISARGA.N</div>
              <div>• PRANAVIKA.M</div>
              <div>• PUNEETH.S.V</div>
            </div>
          </div>

          <div style={{
            marginTop: 'auto',
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <strong>Guide: Prof. Vishvakiran</strong>
            <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
              K.S. Institute of Technology
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;