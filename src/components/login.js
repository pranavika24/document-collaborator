import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in!');
      } else {
        // Sign up
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created!');
      }
    } catch (error) {
      console.error('Error:', error.message);
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h2>{isLogin ? 'Login to Document Collaboration' : 'Create Account'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0', fontSize: '16px' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0', fontSize: '16px' }}
          required
        />
        <button 
          type="submit" 
          style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', fontSize: '16px' }}
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <button 
        onClick={() => setIsLogin(!isLogin)}
        style={{ background: 'none', border: 'none', color: '#007bff', marginTop: '15px', fontSize: '14px', cursor: 'pointer' }}
      >
        {isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
      </button>
    </div>
  );
}

export default Login;