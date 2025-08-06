import React, { useState } from 'react';
import axios from 'axios';
import Registration from './Registration';

interface LoginProps {
  onLogin: (userId: number, token: string, isAdmin: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Invio credenziali:', credentials);
      
      // Prova con l'endpoint di test che sappiamo funzionare
      const apiUrl = '/api/test-auth';
      console.log('URL API per debug:', apiUrl);
      
      // Prima testiamo con l'endpoint di test
      const testResponse = await axios.post(apiUrl, credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test response:', testResponse.data);
      
      // Poi proviamo con l'endpoint di login
      const loginUrl = '/api/auth/login';
      console.log('URL API login:', loginUrl);
      
      const response = await axios.post(loginUrl, credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Risposta:', response.data);
      
      if (response.data.success) {
        const { token, userId, isAdmin } = response.data.data;
        
        // Salva il token nel localStorage
        localStorage.setItem('token', token);
        
        // Notifica il componente padre del login avvenuto con successo
        console.log("Login effettuato con successo, isAdmin:", isAdmin);
        onLogin(userId, token, isAdmin);
      } else {
        setError(response.data.message || 'Errore durante il login');
      }
    } catch (err: any) {
      console.error('Errore durante il login:', err);
      console.error('Dettagli errore:', err.response?.data);
      setError(err.response?.data?.message || 'Impossibile effettuare il login. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  if (showRegistration) {
    return <Registration onLogin={onLogin} onCancel={() => setShowRegistration(false)} />;
  }

  return (
    <div className="login-container">
      <h2>Accedi</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
      
      <div className="registration-link">
        <p>Non hai un account? <button onClick={() => setShowRegistration(true)} className="link-button">Registrati come cliente</button></p>
      </div>
    </div>
  );
};

export default Login;