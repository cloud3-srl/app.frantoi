import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import CompanySelector from './components/CompanySelector';
import AdminCompanies from './components/AdminCompanies';
import UserManagement from './components/UserManagement';
import TablesManager from './components/admin/TablesManager';
import TablePage from './components/admin/TablePage';
import AdminTools from './components/admin/AdminTools';
import CompanyTables from './components/CompanyTables';
import UserDashboard from './components/UserDashboard';
import ConferimentoCterzi from './components/operations/ConferimentoCterzi';
import ConferimentoCAcquisto from './components/operations/ConferimentoCAcquisto';
import ConferimentoCproprio from './components/operations/ConferimentoCproprio';
import CalendarioAttivita from './components/operations/CalendarioAttivita';
import PrenotazioneMoliture from './components/operations/PrenotazioneMoliture';
import PrenotazioniViewer from './components/operations/PrenotazioniViewer';
import MolituraCterzi from './components/operations/MolituraCterzi';
import MolituraCproprio from './components/operations/MolituraCproprio';
import DocumentiTrasporto from './components/operations/DocumentiTrasporto';
import Fatture from './components/operations/Fatture';
import ReportStatistiche from './components/operations/ReportStatistiche';
import VisualizeCisterne from './components/operations/VisualizeCisterne';
import TracciabilitaCisterna from './components/operations/TracciabilitaCisterna';
import OperazioniDaInviare from './components/operations/OperazioniDaInviare';

const App: React.FC = () => {
  // Stato per l'autenticazione
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Stato per la selezione dell'azienda
  const [selectedCompany, setSelectedCompany] = useState<{
    id: number;
    code: string;
    description?: string;
  } | null>(null);
  
  // Stato per la navigazione
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  
  // Stato per controllare la visualizzazione della dashboard o delle tabelle
  const [showTables, setShowTables] = useState<boolean>(false);

  // Verifica se l'utente è già autenticato all'avvio dell'app
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Configura axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verifica la validità del token con endpoint di debug
      axios.get('/api/debug/auth/me')
      .then(debugResponse => {
        console.log("Debug auth response:", debugResponse.data);
        
        // Poi verifica con l'endpoint standard
        return axios.get('/api/auth/me');
      })
      .then(response => {
        if (response.data.success) {
          const userData = response.data.data;
          setIsAuthenticated(true);
          setUserId(userData.id);
          setIsAdmin(userData.isAdmin);
          console.log("Utente autenticato:", {
            id: userData.id, 
            ruolo: userData.ruolo,
            isAdmin: userData.isAdmin
          });
        } else {
          // Token non valido, pulisci il localStorage
          localStorage.removeItem('token');
        }
      })
      .catch((error) => {
        // Errore nella verifica del token, pulisci il localStorage
        console.error("Errore nella verifica del token:", error);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Gestione del login
  const handleLogin = (userId: number, token: string, isAdmin: boolean) => {
    setIsAuthenticated(true);
    setUserId(userId);
    setIsAdmin(isAdmin);
  };

  // Gestione del logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserId(null);
    setIsAdmin(false);
    setSelectedCompany(null);
    setShowTables(false);
  };

  // Gestione della selezione dell'azienda
  const handleSelectCompany = (companyId: number, companyCode: string, companyDescription?: string) => {
    setSelectedCompany({
      id: companyId,
      code: companyCode,
      description: companyDescription
    });
    
    // Imposta l'header per le richieste future
    axios.defaults.headers.common['X-Company-Id'] = companyId.toString();
    
    // Passa alla dashboard dopo la selezione dell'azienda
    setActiveSection('dashboard');
  };

  // Gestione della navigazione
  const navigateTo = (section: string) => {
    setActiveSection(section);
    
    // Reset dello stato delle tabelle quando si naviga fuori dalla dashboard
    if (section !== 'dashboard') {
      setShowTables(false);
    }
    
    // Navigazione in base alla sezione
    switch(section) {
      case 'dashboard':
        window.location.href = '/';
        break;
      case 'companies':
        window.location.href = '/admin/companies';
        break;
      case 'users':
        window.location.href = '/admin/users';
        break;
      case 'tables':
        window.location.href = '/admin/tables';
        break;
    }
  };

  if (loading) {
    return <div className="loading">Caricamento...</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header sap-header flex items-center justify-between px-0 py-0 shadow-md bg-white sticky top-0 z-50 border-b border-gray-200">
          <div className="header-logo flex items-center px-6 py-2">
            <img src="/img/logo_appfrantoio_140x30.png" alt="App Frantoi" className="h-8 mr-4" />
          </div>
          <nav className="main-nav flex-1 flex items-center justify-end">
            {isAuthenticated && isAdmin && (
              <ul className="flex gap-2 mr-4">
                <li>
                  <button
                    className={`rounded-full px-4 py-2 font-medium transition-colors ${activeSection === 'companies' ? 'bg-[var(--primary-color)] text-white' : 'bg-transparent text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white'}`}
                    onClick={() => navigateTo('companies')}
                  >
                    <i className="fas fa-building mr-2"></i> Gestione Aziende
                  </button>
                </li>
                <li>
                  <button
                    className={`rounded-full px-4 py-2 font-medium transition-colors ${activeSection === 'users' ? 'bg-[var(--primary-color)] text-white' : 'bg-transparent text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white'}`}
                    onClick={() => navigateTo('users')}
                  >
                    <i className="fas fa-users mr-2"></i> Gestione Utenti
                  </button>
                </li>
                <li>
                  <button
                    className={`rounded-full px-4 py-2 font-medium transition-colors ${activeSection === 'tables' ? 'bg-[var(--primary-color)] text-white' : 'bg-transparent text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white'}`}
                    onClick={() => navigateTo('tables')}
                  >
                    <i className="fas fa-table mr-2"></i> Tabelle Base
                  </button>
                </li>
              </ul>
            )}
            {isAuthenticated && (
              <div className="header-actions flex items-center">
                <button onClick={handleLogout} className="btn-logout rounded-full px-4 py-2 font-medium ml-2 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-dark)] transition-colors">
                  <i className="fas fa-sign-out-alt mr-2"></i> Logout
                </button>
              </div>
            )}
          </nav>
        </header>
        
        <main>
          <Routes>
            <Route 
              path="/" 
              element={
                !isAuthenticated ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  !selectedCompany ? (
                    <CompanySelector userId={userId!} onSelectCompany={handleSelectCompany} />
                  ) : (
                    <div className="company-context">
                      <div className="company-info">
                        <p>Azienda selezionata: <strong>{selectedCompany.description || selectedCompany.code.toUpperCase()}</strong></p>
                      </div>
                      
                      {showTables ? (
                        <section className="dashboard">
                          <div className="dashboard-header">
                            <h2>Tabelle Aziendali</h2>
                            <button 
                              onClick={() => setShowTables(false)}
                              className="tables-button"
                            >
                              <i className="fas fa-tachometer-alt"></i> Torna alla Dashboard
                            </button>
                          </div>
                          
                          {/* Tabelle aziendali */}
                          <CompanyTables 
                            companyId={selectedCompany.id} 
                            companyCode={selectedCompany.code} 
                          />
                        </section>
                      ) : (
                        <section className="dashboard">
                          <UserDashboard 
                            companyId={selectedCompany.id}
                            companyCode={selectedCompany.code}
                            onNavigateToTables={() => setShowTables(true)}
                          />
                        </section>
                      )}
                    </div>
                  )
                )
              } 
            />
            
            {/* Rotte solo per admin */}
            <Route 
              path="/admin/companies" 
              element={
                isAuthenticated && isAdmin ? (
                  <AdminCompanies />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/admin/users" 
              element={
                isAuthenticated && isAdmin ? (
                  <UserManagement />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/admin/tables" 
              element={
                isAuthenticated && isAdmin ? (
                  <TablesManager />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/admin/tables/:tableName" 
              element={
                isAuthenticated && isAdmin ? (
                  <TablePage />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotte per le operazioni aziendali */}
            <Route 
              path="/company/:companyCode/operations/conferimento-cterzi" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <ConferimentoCterzi 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                      key={`conferimento-cterzi-${selectedCompany.id}`} // Forza re-render quando cambia l'azienda
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/conferimento-cacquisto" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <ConferimentoCAcquisto 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                      key={`conferimento-cacquisto-${selectedCompany.id}`} // Forza re-render quando cambia l'azienda
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/conferimento-cproprio" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <ConferimentoCproprio
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                      key={`conferimento-cproprio-${selectedCompany.id}`}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/movimentazione" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <h2>Movimentazione Olio</h2>
                    <p>Implementazione in corso...</p>
                    <button onClick={() => window.history.back()}>Torna indietro</button>
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/registro-giornaliero" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <h2>Registro Giornaliero</h2>
                    <p>Implementazione in corso...</p>
                    <button onClick={() => window.history.back()}>Torna indietro</button>
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/documenti-trasporto" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <DocumentiTrasporto 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/fatture" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <Fatture 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/anagrafica-clienti" 
              element={
                isAuthenticated && selectedCompany ? (
                  <Navigate to="/" replace />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/gestione-cisterne" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <VisualizeCisterne 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/tracciabilita-cisterna" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <TracciabilitaCisterna 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/tracciabilita-cisterna/:cisternaId" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <TracciabilitaCisterna 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            <Route 
              path="/company/:companyCode/operations/trasmissione-sian" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <h2>Trasmissione SIAN</h2>
                    <p>Implementazione in corso...</p>
                    <button onClick={() => window.history.back()}>Torna indietro</button>
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />

            {/* Rotta per le operazioni da inviare al SIAN */}
            <Route 
              path="/company/:companyCode/operations/operazioni-da-inviare" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <OperazioniDaInviare />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per i report e statistiche */}
            <Route 
              path="/company/:companyCode/operations/report-statistiche" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <ReportStatistiche 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per il calendario attività */}
            <Route 
              path="/company/:companyCode/operations/calendario" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <CalendarioAttivita />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per la prenotazione moliture */}
            <Route 
              path="/company/:companyCode/operations/prenotazione" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <PrenotazioneMoliture 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per la visualizzazione prenotazioni */}
            <Route 
              path="/company/:companyCode/operations/prenotazioni-viewer" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <PrenotazioniViewer 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per la molitura conto terzi */}
            <Route 
              path="/company/:companyCode/operations/molitura-cterzi" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <MolituraCterzi 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per la molitura conto proprio */}
            <Route 
              path="/company/:companyCode/operations/molitura-cproprio" 
              element={
                isAuthenticated && selectedCompany ? (
                  <div className="operation-page">
                    <MolituraCproprio 
                      companyId={selectedCompany.id}
                      companyCode={selectedCompany.code}
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            
            {/* Rotta per gli strumenti di amministrazione */}
            <Route 
              path="/company/:companyCode/admin-tools" 
              element={
                isAuthenticated && isAdmin && selectedCompany ? (
                  <div className="admin-tools-page">
                    <h2>Strumenti di Amministrazione</h2>
                    <div className="back-navigation">
                      <button onClick={() => window.history.back()}>
                        <i className="fas fa-arrow-left"></i> Torna alla Dashboard
                      </button>
                    </div>
                    <AdminTools 
                      companyId={selectedCompany.id} 
                      companyCode={selectedCompany.code} 
                    />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
          </Routes>
        </main>
        
        <footer>
          <p>&copy;2025 CLOUD3 SRL a Socio unico - P.IVA. IT02497740999 - help@cloud3.srl</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
