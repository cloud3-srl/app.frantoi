import React, { useState } from 'react';
import axios from 'axios';

interface RegistrationProps {
  onLogin: (userId: number, token: string, isAdmin: boolean) => void;
  onCancel: () => void;
}

interface RegistrationForm {
  descrizione: string;
  email: string;
  password: string;
  confermaPassword: string;
  telefono: string;
}

const Registration: React.FC<RegistrationProps> = ({ onLogin, onCancel }) => {
  const [form, setForm] = useState<RegistrationForm>({
    descrizione: '',
    email: '',
    password: '',
    confermaPassword: '',
    telefono: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Validazione
    if (form.password !== form.confermaPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }
    
    try {
      // Prepara i dati per la registrazione
      const registrationData = {
        descrizione: form.descrizione,
        email: form.email,
        password: form.password,
        telefono: form.telefono
      };
      
      console.log('Invio dati registrazione:', registrationData);
      
      const response = await axios.post('/api/auth/register', registrationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Risposta:', response.data);
      
      if (response.data.success) {
        setSuccessMessage('Registrazione completata! Controlla la tua email per verificare il tuo account.');
        // Reset del form dopo registrazione riuscita
        setForm({
          descrizione: '',
          email: '',
          password: '',
          confermaPassword: '',
          telefono: ''
        });
      } else {
        setError(response.data.message || 'Errore durante la registrazione');
      }
    } catch (err: any) {
      console.error('Errore durante la registrazione:', err);
      console.error('Dettagli errore:', err.response?.data);
      setError(err.response?.data?.message || 'Impossibile completare la registrazione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="registration-container">
      <h2>Registrazione nuovo cliente</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="descrizione">Nome e Cognome / Ragione Sociale*</label>
          <input
            type="text"
            id="descrizione"
            name="descrizione"
            value={form.descrizione}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email*</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password*</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confermaPassword">Conferma Password*</label>
          <input
            type="password"
            id="confermaPassword"
            name="confermaPassword"
            value={form.confermaPassword}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telefono">Telefono*</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-info">
          <p>Gli altri dati del profilo potranno essere completati dopo la verifica dell'email.</p>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
};

export default Registration;