import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import UnitCountOne from './dashboard/UnitCountOne';

interface BaseOperationItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  onClick?: () => void;
}

interface SingleOperationItem extends BaseOperationItem {
  isGroup?: false;
}

interface GroupOperationItem extends BaseOperationItem {
  isGroup: true;
  children: BaseOperationItem[];
}

type DashboardOperation = SingleOperationItem | GroupOperationItem;

interface UserDashboardProps {
  companyId: number;
  companyCode: string;
  onNavigateToTables: () => void;
  isAdmin?: boolean;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ companyId, companyCode, onNavigateToTables, isAdmin: propIsAdmin = false }) => {
  const [isAdmin, setIsAdmin] = useState(propIsAdmin);
  
  // Stato per menu espandibili
  const [expandedMenus, setExpandedMenus] = useState<{[key: string]: boolean}>({});
  
  // Funzione per espandere/chiudere menu
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };
  
  // Verifica se l'utente è admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setIsAdmin(response.data.data.isAdmin);
        }
      } catch (error) {
        console.error('Errore nel verificare lo stato admin:', error);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Funzioni quotidiane dell'operatore
  const dailyOperations: DashboardOperation[] = [
    { 
      id: 'prenotazione', 
      name: 'Prenotazione', 
      description: 'Gestione delle prenotazioni di molitura', 
      icon: 'calendar-check',
      color: '#f5e79e', // Tonalità pastello giallo chiaro
      route: `/company/${companyCode}/operations/prenotazione`
    },
    { 
      id: 'prenotazioni-viewer', 
      name: 'Visualizza Prenotazioni', 
      description: 'Visualizzazione filtrata delle prenotazioni con conversione a conferimento', 
      icon: 'list-alt',
      color: '#f5d7a0', // Tonalità pastello giallo/arancio
      route: `/company/${companyCode}/operations/prenotazioni-viewer`
    },
    {
      id: 'conferimento-group',
      name: 'Conferimento',
      description: 'Gestione di tutti i tipi di conferimenti olive',
      icon: 'leaf',
      color: '#aed9a0', // Tonalità pastello verde oliva chiaro
      route: '#',
      isGroup: true,
      children: [
        { 
          id: 'conferimento-cterzi', 
          name: 'Conferimento c/terzi', 
          description: 'Gestione dei conferimenti di olive per conto terzi', 
          icon: 'truck-loading',
          color: '#aed9a0', // Tonalità pastello verde oliva chiaro
          route: `/company/${companyCode}/operations/conferimento-cterzi`
        },
        { 
          id: 'conferimento-cacquisto', 
          name: 'Conferimento c/acquisto', 
          description: 'Gestione degli acquisti di olive', 
          icon: 'shopping-cart',
          color: '#aed9a0', // Tonalità pastello verde oliva chiaro
          route: `/company/${companyCode}/operations/conferimento-cacquisto`
        },
        { 
          id: 'conferimento-cproprio', 
          name: 'Conferimento c/proprio', 
          description: 'Gestione dei conferimenti di olive in conto proprio', 
          icon: 'tractor',
          color: '#aed9a0', // Tonalità pastello verde oliva chiaro
          route: `/company/${companyCode}/operations/conferimento-cproprio`
        }
      ]
    },
    {
      id: 'molitura-group',
      name: 'Molitura',
      description: 'Gestione di tutti i tipi di moliture',
      icon: 'dharmachakra',
      color: '#b5a897', // Tonalità pastello marrone sabbia
      route: '#',
      isGroup: true,
      children: [
        { 
          id: 'molitura-cterzi', 
          name: 'Molitura c/terzi', 
          description: 'Gestione delle moliture per conto terzi', 
          icon: 'dharmachakra',
          color: '#b5a897', // Tonalità pastello marrone sabbia
          route: `/company/${companyCode}/operations/molitura-cterzi`
        },
        { 
          id: 'molitura-cproprio', 
          name: 'Molitura c/proprio', 
          description: 'Gestione delle moliture in conto proprio', 
          icon: 'dharmachakra',
          color: '#b5a897', // Tonalità pastello marrone sabbia
          route: `/company/${companyCode}/operations/molitura-cproprio`
        }
      ]
    },
    { 
      id: 'movimentazione', 
      name: 'Movimentazione Olio', 
      description: 'Registrazione di carico/scarico e trasferimenti olio', 
      icon: 'exchange-alt',
      color: '#92d1c3', // Tonalità pastello verde acqua
      route: `/company/${companyCode}/operations/movimentazione`
    },
    {
      id: 'registro-sian-group',
      name: 'Registro Olii Sian',
      description: 'Gestione del registro ufficiale degli olii',
      icon: 'book-open',
      color: '#a4c5f4', // Tonalità pastello azzurro cielo
      route: '#',
      isGroup: true,
      children: [
        { 
          id: 'registro-giornaliero', 
          name: 'Registro Giornaliero', 
          description: 'Visualizzazione e gestione del registro operazioni SIAN', 
          icon: 'book-open',
          color: '#a4c5f4', // Tonalità pastello azzurro cielo
          route: `/company/${companyCode}/operations/registro-giornaliero`
        },
        { 
          id: 'operazioni-da-inviare', 
          name: 'Operazioni da Inviare', 
          description: 'Visualizzazione delle operazioni da trasmettere al SIAN', 
          icon: 'paper-plane',
          color: '#a4c5f4', // Tonalità pastello azzurro cielo
          route: `/company/${companyCode}/operations/operazioni-da-inviare`
        }
      ]
    },
    { 
      id: 'documenti-trasporto', 
      name: 'Documenti di Trasporto', 
      description: 'Creazione e gestione dei DDT e documenti di accompagnamento', 
      icon: 'file-invoice',
      color: '#bbc7d6', // Tonalità pastello grigio azzurro
      route: `/company/${companyCode}/operations/documenti-trasporto`
    },
    { 
      id: 'fatture', 
      name: 'Fatture', 
      description: 'Gestione e visualizzazione delle fatture emesse e ricevute', 
      icon: 'file-invoice-dollar',
      color: '#d7c0ef', // Tonalità pastello lavanda
      route: `/company/${companyCode}/operations/fatture`
    }
  ];

  // Funzioni amministrative
  const administrativeOperations: DashboardOperation[] = [
    {
      id: 'anagrafica-group',
      name: 'Anagrafica',
      description: 'Gestione di tutte le anagrafiche del sistema',
      icon: 'address-book',
      color: '#d7c0ef', // Tonalità pastello lavanda
      route: '#',
      isGroup: true,
      children: [
        { 
          id: 'anagrafica-clienti', 
          name: 'Anagrafica Soggetti', 
          description: 'Gestione dell\'anagrafica clienti, fornitori e terzisti', 
          icon: 'user-friends',
          color: '#d7c0ef', // Tonalità pastello lavanda
          route: `/company/${companyCode}/operations/anagrafica-clienti`
        },
        { 
          id: 'gestione-tabelle', 
          name: 'Gestione Tabelle Aziendali', 
          description: 'Gestione delle tabelle di base dell\'azienda', 
          icon: 'table',
          color: '#d7c0ef', // Tonalità pastello lavanda
          route: '#',
          onClick: onNavigateToTables
        }
      ]
    },
    {
      id: 'cisterne-group',
      name: 'Gestione Cisterne',
      description: 'Monitoraggio giacenze e gestione dei contenitori di stoccaggio',
      icon: 'warehouse',
      color: '#f3d8a0', // Tonalità pastello giallo crema
      route: '#',
      isGroup: true,
      children: [
        { 
          id: 'visualizza-cisterne', 
          name: 'Visualizzazione Cisterne', 
          description: 'Monitoraggio giacenze e stato delle cisterne', 
          icon: 'eye',
          color: '#f3d8a0', // Stessa tonalità del gruppo
          route: `/company/${companyCode}/operations/gestione-cisterne`
        },
        { 
          id: 'tracciabilita-cisterna', 
          name: 'Tracciabilità Cisterna', 
          description: 'Tracciabilità e storia delle cisterne', 
          icon: 'route',
          color: '#f3d8a0', // Stessa tonalità del gruppo
          route: `/company/${companyCode}/operations/tracciabilita-cisterna`
        }
      ]
    },
    {
      id: 'documenti-group',
      name: 'Documenti e Report',
      description: 'Gestione di tutti i documenti e report di sistema',
      icon: 'file-alt',
      color: '#a1dce9', // Tonalità pastello azzurro acqua
      route: '#',
      isGroup: true,
      children: [
        { 
          id: 'trasmissione-sian', 
          name: 'Trasmissione SIAN', 
          description: 'Preparazione e invio telematico dei dati al SIAN', 
          icon: 'cloud-upload-alt',
          color: '#a1dce9', // Stessa tonalità del gruppo
          route: `/company/${companyCode}/operations/trasmissione-sian`
        },
        { 
          id: 'report-statistiche', 
          name: 'Report e Statistiche', 
          description: 'Visualizzazione report di produzione e andamento della campagna', 
          icon: 'chart-bar',
          color: '#a1dce9', // Stessa tonalità del gruppo
          route: `/company/${companyCode}/operations/report-statistiche`
        }
      ]
    }
  ];

  // Rendering dei menu
  const renderOperation = (operation: DashboardOperation) => {
    if (operation.isGroup) {
      return (
        <div className="card-group">
          <div 
            className="card-top-link group-header" 
            onClick={() => toggleMenu(operation.id)}
          >
            <div className="card-icon" style={{ 
              backgroundColor: operation.color
            }}>
              <i className={`fas fa-${operation.icon}`}></i>
            </div>
            <div className="card-content">
              <h4 className="font-semibold text-xl">{operation.name}</h4>
              <div className="help-icon-container">
                <i className="fas fa-question-circle help-icon" title={operation.description}></i>
                <div className="description-tooltip">{operation.description}</div>
                <i className={`fas fa-chevron-${expandedMenus[operation.id] ? 'up' : 'down'} menu-toggle-icon`} 
                  style={{transform: expandedMenus[operation.id] ? 'rotate(180deg)' : 'rotate(0deg)'}}></i>
              </div>
            </div>
          </div>
          
          {expandedMenus[operation.id] && (
            <div className="submenu">
              {operation.children.map(subItem => (
                subItem.onClick ? (
                  <div className="submenu-item" key={subItem.id} onClick={subItem.onClick}>
                    <div className="submenu-icon">
                      <i className={`fas fa-${subItem.icon}`}></i>
                    </div>
                    <div className="submenu-content">
                      <span>{subItem.name}</span>
                    </div>
                  </div>
                ) : (
                  <Link to={subItem.route} className="submenu-item" key={subItem.id}>
                    <div className="submenu-icon">
                      <i className={`fas fa-${subItem.icon}`}></i>
                    </div>
                    <div className="submenu-content">
                      <span>{subItem.name}</span>
                    </div>
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Link to={operation.route} className="card-top-link">
<div
  className="card-icon"
  style={{ fontSize: "2.25rem" }}
>
  <i className={`fas fa-${operation.icon} text-3xl`}></i>
</div>
          <div className="card-content">
            <h4>{operation.name}</h4>
            <div className="help-icon-container">
              <i className="fas fa-question-circle help-icon" title={operation.description}></i>
              <div className="description-tooltip">{operation.description}</div>
            </div>
          </div>
        </Link>
      );
    }
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>
          Dashboard Operatore
          <i className="fas fa-tachometer-alt ml-3"></i>
        </h2>
      </div>

      

      <section className="dashboard-section">
        <h3>
          Operazioni Quotidiane
          <i className="fas fa-clipboard-list section-title-icon"></i>
        </h3>
        <div className="section-divider" />
        <div className="dashboard-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dailyOperations.map(operation => (
<div
  className="dashboard-card gradient-border-card compact dark:bg-neutral-800 rounded-3xl shadow-lg p-8 flex flex-col items-center transition-transform hover:scale-105"
  key={operation.id}
  style={{ backgroundColor: operation.color, '--card-icon-bg': operation.color } as React.CSSProperties}
>
  {renderOperation(operation)}
</div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h3>
          Funzioni Amministrative
          <i className="fas fa-cogs section-title-icon"></i>
        </h3>
        <div className="section-divider" />
        <div className="dashboard-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {administrativeOperations.map(operation => (
            <div
              className="dashboard-card gradient-border-card compact dark:bg-neutral-800 rounded-3xl shadow-lg p-8 flex flex-col items-center transition-transform hover:scale-105"
              key={operation.id}
              style={{ backgroundColor: operation.color, '--card-icon-bg': operation.color } as React.CSSProperties}
            >
              {renderOperation(operation)}
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section tables-section">
        <div className="tables-button-container">
          {/* Rimosso il bottone Home come richiesto */}
          
          {isAdmin && (
            <Link 
              to={`/company/${companyCode}/admin-tools`}
              className="tables-button-footer admin-button"
            >
              <i className="fas fa-tools"></i> Strumenti Amministratore
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;
