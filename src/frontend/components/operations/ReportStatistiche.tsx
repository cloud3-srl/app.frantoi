import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registra i componenti di ChartJS necessari
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// Interfacce per i dati del calendario
interface CalendarioEntry {
  id: number;
  id_cliente: number;
  descrizione_cliente?: string;
  data_inizio: string;
  data_fine: string;
  ora_inizio: string;
  ora_fine: string;
  tipo_olive: string;
  quantita_stimata: number;
  id_linea?: number;
  nome_linea?: string;
  stato: string;
  note?: string;
  flag_cproprio: boolean;
}

// Interfacce per i movimenti
interface Movimento {
  id: number;
  id_soggetto: number;
  descrizione_soggetto?: string;
  campo04: string; // data operazione
  campo07: string; // tipo operazione
  campo24?: number | string; // Quantità olio (kg)
  flag_sono_molitura: boolean;
  flag_fatturato: boolean; 
  costo_molitura_kg?: number | string;
  tipo_olive?: string; // Tipo di olive
}

// Interfaccia per i filtri
interface FiltersState {
  startDate: string;
  endDate: string;
  clientFilter: string;
  oliveTypeFilter: string;
}

// Interfaccia per le props del componente
interface ReportStatisticheProps {
  companyId?: number;
  companyCode?: string;
}

// Funzione per convertire un valore in numero
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
};

const ReportStatistiche: React.FC<ReportStatisticheProps> = ({ companyId, companyCode }) => {
  const { companyCode: urlCompanyCode } = useParams<{ companyCode: string }>();
  const effectiveCompanyCode = companyCode || urlCompanyCode;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per i dati
  const [calendarioEntries, setCalendarioEntries] = useState<CalendarioEntry[]>([]);
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [clientesList, setClientesList] = useState<{id: number, descrizione: string}[]>([]);
  const [tipiOlive, setTipiOlive] = useState<string[]>([]);
  
  // Stato per i filtri
  const [filters, setFilters] = useState<FiltersState>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), // 1 gennaio dell'anno corrente
    endDate: new Date().toISOString().slice(0, 10), // oggi
    clientFilter: '',
    oliveTypeFilter: '',
  });

  // Stato per la visualizzazione attiva
  const [activeView, setActiveView] = useState<'calendar' | 'movements'>('calendar');
  
  // Carica i dati all'avvio
  useEffect(() => {
    if (!companyId && !effectiveCompanyCode) {
      console.log('CompanyId o companyCode mancanti');
      return;
    }

    fetchData();
  }, [companyId, effectiveCompanyCode]);

  // Funzione per recuperare tutti i dati necessari
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Recupera dati dal calendario
      const calendarioResponse = await axios.get(`/api/company/${companyId}/tables/calendario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!calendarioResponse.data.success) {
        throw new Error('Errore nel recupero dei dati del calendario');
      }
      
      // Recupera i movimenti
      const movimentiResponse = await axios.get(`/api/company/${companyId}/tables/movimenti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!movimentiResponse.data.success) {
        throw new Error('Errore nel recupero dei movimenti');
      }
      
      // Recupera i clienti per l'anagrafica
      const soggettiResponse = await axios.get(`/api/company/${companyId}/tables/soggetti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Associa i dati delle tabelle correlate
      const calendarioWithClients = calendarioResponse.data.data.map((entry: any) => {
        const cliente = soggettiResponse.data.data.find((s: any) => s.id === entry.id_cliente);
        return {
          ...entry,
          descrizione_cliente: cliente ? cliente.descrizione : 'Cliente non specificato'
        };
      });
      
      const movimentiWithClients = movimentiResponse.data.data.map((m: any) => {
        const soggetto = soggettiResponse.data.data.find((s: any) => s.id === m.id_soggetto);
        return {
          ...m,
          descrizione_soggetto: soggetto ? soggetto.descrizione : 'Non specificato'
        };
      });
      
      // Estrai la lista unica dei clienti
      const uniqueClients = Array.from(
        new Map(soggettiResponse.data.data.map((item: any) => [item.id, item])).values()
      ).map((cliente: any) => ({
        id: cliente.id,
        descrizione: cliente.descrizione || 'Cliente senza nome'
      }));

      // Estrai la lista unica dei tipi di olive
      const uniqueOliveTypes = Array.from(
        new Set(
          calendarioWithClients
            .map((item: any) => item.tipo_olive)
            .filter(Boolean)
        )
      );
      
      setCalendarioEntries(calendarioWithClients);
      setMovimenti(movimentiWithClients);
      setClientesList(uniqueClients);
      setTipiOlive(uniqueOliveTypes as string[]);
      setLoading(false);
    } catch (error: any) {
      console.error('Errore nel recupero dei dati:', error);
      setError(error.message || 'Si è verificato un errore nel caricamento dei dati');
      setLoading(false);
    }
  };

  // Funzione per filtrare i dati del calendario in base ai criteri attivi
  const getFilteredCalendarData = () => {
    return calendarioEntries.filter(entry => {
      const entryDate = new Date(entry.data_inizio);
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      
      const meetsDateCriteria = entryDate >= startDate && entryDate <= endDate;
      const meetsClientCriteria = !filters.clientFilter || entry.id_cliente.toString() === filters.clientFilter;
      const meetsOliveTypeCriteria = !filters.oliveTypeFilter || entry.tipo_olive === filters.oliveTypeFilter;
      
      return meetsDateCriteria && meetsClientCriteria && meetsOliveTypeCriteria;
    });
  };

  // Funzione per filtrare i movimenti in base ai criteri attivi
  const getFilteredMovements = () => {
    return movimenti.filter(movimento => {
      const movDate = new Date(movimento.campo04);
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      
      const meetsDateCriteria = movDate >= startDate && movDate <= endDate;
      const meetsClientCriteria = !filters.clientFilter || movimento.id_soggetto.toString() === filters.clientFilter;
      const meetsOliveTypeCriteria = !filters.oliveTypeFilter || movimento.tipo_olive === filters.oliveTypeFilter;
      
      return meetsDateCriteria && meetsClientCriteria && meetsOliveTypeCriteria;
    });
  };

  // Calcolo delle statistiche per grafico a barre di calendario per tipo di oliva
  const getCalendarOliveTypeChartData = () => {
    const filteredData = getFilteredCalendarData();
    const oliveTypesMap: Record<string, number> = {};
    
    filteredData.forEach(entry => {
      const type = entry.tipo_olive || 'Non specificato';
      oliveTypesMap[type] = (oliveTypesMap[type] || 0) + toNumber(entry.quantita_stimata);
    });
    
    return {
      labels: Object.keys(oliveTypesMap),
      datasets: [
        {
          label: 'Quantità stimata olive (kg)',
          data: Object.values(oliveTypesMap),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Calcolo delle statistiche per grafico a torta di calendario per stato
  const getCalendarStatusPieData = () => {
    const filteredData = getFilteredCalendarData();
    const statusMap: Record<string, number> = {};
    
    filteredData.forEach(entry => {
      const status = entry.stato || 'Non specificato';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    return {
      labels: Object.keys(statusMap),
      datasets: [
        {
          data: Object.values(statusMap),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Calcolo delle statistiche per grafico a linee delle moliture nel tempo
  const getMovimentiLineData = () => {
    const filteredData = getFilteredMovements().filter(m => m.flag_sono_molitura);
    
    // Raggruppamento per data
    const dataByDate: Record<string, number> = {};
    
    filteredData.forEach(movimento => {
      const date = new Date(movimento.campo04).toISOString().split('T')[0];
      const olioQuantity = toNumber(movimento.campo24);
      dataByDate[date] = (dataByDate[date] || 0) + olioQuantity;
    });
    
    // Ordina le date
    const sortedDates = Object.keys(dataByDate).sort();
    
    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Produzione Olio (kg)',
          data: sortedDates.map(date => dataByDate[date]),
          fill: false,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1
        },
      ],
    };
  };

  // Calcolo delle statistiche per grafico a barre dei clienti con più olio
  const getTopClientsChartData = () => {
    const filteredData = getFilteredMovements().filter(m => m.flag_sono_molitura);
    const clientOilMap: Record<string, number> = {};
    
    filteredData.forEach(movimento => {
      const clientName = movimento.descrizione_soggetto || `Cliente ID: ${movimento.id_soggetto}`;
      const olioQuantity = toNumber(movimento.campo24);
      clientOilMap[clientName] = (clientOilMap[clientName] || 0) + olioQuantity;
    });
    
    // Ordinamento decrescente e presa dei primi 10 clienti
    const sortedClients = Object.entries(clientOilMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: sortedClients.map(([name]) => name),
      datasets: [
        {
          label: 'Quantità Olio (kg)',
          data: sortedClients.map(([, value]) => value),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Opzioni generiche per i grafici
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Statistiche',
      },
    },
  };

  // Funzione per tornare alla dashboard
  const handleBackToMain = () => {
    window.location.href = '/';
  };

  // Funzione per aggiornare i filtri
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funzione per resettare i filtri
  const handleResetFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      clientFilter: '',
      oliveTypeFilter: '',
    });
  };

  // Rendering della pagina
  return (
    <div className="report-statistiche-container">
      <div className="page-header">
        <div className="header-left-buttons">
          <button 
            className="back-button"
            onClick={handleBackToMain}
          >
            <i className="fas fa-arrow-left"></i> Torna alla Home
          </button>
        </div>
        <h2>Report e Statistiche</h2>
        <div className="subtitle">Visualizzazione e analisi dati operativi</div>
      </div>

      {/* Pannello filtri */}
      <div className="filters-panel">
        <h3>Filtri</h3>
        <div className="filters-form">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="startDate">Data Inizio:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="endDate">Data Fine:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="clientFilter">Cliente:</label>
              <select
                id="clientFilter"
                name="clientFilter"
                value={filters.clientFilter}
                onChange={handleFilterChange}
              >
                <option value="">Tutti i clienti</option>
                {clientesList.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.descrizione}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="oliveTypeFilter">Tipo Olive:</label>
              <select
                id="oliveTypeFilter"
                name="oliveTypeFilter"
                value={filters.oliveTypeFilter}
                onChange={handleFilterChange}
              >
                <option value="">Tutti i tipi</option>
                {tipiOlive.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              <button 
                className="reset-filters-button"
                onClick={handleResetFilters}
              >
                <i className="fas fa-undo"></i> Reset Filtri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs per cambiare vista */}
      <div className="view-tabs">
        <button 
          className={`tab-button ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          <i className="fas fa-calendar-alt"></i> Statistiche Prenotazioni
        </button>
        <button 
          className={`tab-button ${activeView === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveView('movements')}
        >
          <i className="fas fa-exchange-alt"></i> Statistiche Produzione
        </button>
      </div>

      {/* Mostra messaggio di caricamento o errore */}
      {loading && <div className="loading">Caricamento dati in corso...</div>}
      {error && <div className="error-message">Errore: {error}</div>}
      
      {/* Statistiche del Calendario */}
      {!loading && !error && activeView === 'calendar' && (
        <div className="statistics-section">
          <div className="charts-container">
            <div className="chart-card">
              <h3>Distribuzione per Tipo di Olive</h3>
              <div className="chart-container">
                <Bar 
                  data={getCalendarOliveTypeChartData()} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Quantità Stimata per Tipo di Olive (kg)'
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="chart-card">
              <h3>Stato delle Prenotazioni</h3>
              <div className="chart-container">
                <Pie 
                  data={getCalendarStatusPieData()} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Distribuzione degli Stati delle Prenotazioni'
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Statistiche aggiuntive */}
          <div className="summary-statistics">
            <div className="stat-card">
              <div className="stat-value">{getFilteredCalendarData().length}</div>
              <div className="stat-label">Totale Prenotazioni</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {getFilteredCalendarData().reduce((sum, entry) => sum + toNumber(entry.quantita_stimata), 0).toLocaleString('it-IT')} kg
              </div>
              <div className="stat-label">Quantità Totale Stimata</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {getFilteredCalendarData().filter(entry => entry.stato === 'completata').length}
              </div>
              <div className="stat-label">Prenotazioni Completate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {getFilteredCalendarData().filter(entry => entry.stato === 'in attesa').length}
              </div>
              <div className="stat-label">Prenotazioni in Attesa</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistiche dei Movimenti */}
      {!loading && !error && activeView === 'movements' && (
        <div className="statistics-section">
          <div className="charts-container">
            <div className="chart-card">
              <h3>Andamento Produzione Olio nel Tempo</h3>
              <div className="chart-container">
                <Line 
                  data={getMovimentiLineData()} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Produzione Olio (kg) per Data'
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="chart-card">
              <h3>Top 10 Clienti per Quantità Olio</h3>
              <div className="chart-container">
                <Bar 
                  data={getTopClientsChartData()} 
                  options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Clienti con Maggior Produzione di Olio (kg)'
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Statistiche aggiuntive */}
          <div className="summary-statistics">
            <div className="stat-card">
              <div className="stat-value">
                {getFilteredMovements().filter(m => m.flag_sono_molitura).length}
              </div>
              <div className="stat-label">Totale Moliture</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {getFilteredMovements()
                  .filter(m => m.flag_sono_molitura)
                  .reduce((sum, m) => sum + toNumber(m.campo24), 0)
                  .toLocaleString('it-IT')} kg
              </div>
              <div className="stat-label">Quantità Totale Olio</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {getFilteredMovements()
                  .filter(m => m.flag_sono_molitura && m.flag_fatturato)
                  .length}
              </div>
              <div className="stat-label">Moliture Fatturate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(getFilteredMovements()
                  .filter(m => m.flag_sono_molitura)
                  .reduce((sum, m) => sum + (toNumber(m.campo24) * toNumber(m.costo_molitura_kg)), 0))
                  .toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
              </div>
              <div className="stat-label">Valore Totale</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportStatistiche;