/**
 * Fatture.tsx
 * -----------
 * Componente per la gestione delle fatture di molitura.
 * 
 * FUNZIONALITÀ:
 * 1. Visualizza un elenco di fatture generate dalle moliture in conto terzi
 * 2. Filtra automaticamente per mostrare solo i movimenti che:
 *    - Sono moliture (flag_sono_molitura=true)
 *    - Hanno campo30='X' (identifica fatture relative a moliture c/terzi)
 * 3. Permette di filtrare ulteriormente per:
 *    - Stato fatturazione (tutte, fatturate, da fatturare)
 *    - Ricerca testuale su cliente, numero documento, codice cliente
 * 4. Consente di:
 *    - Visualizzare l'anteprima di una fattura
 *    - Scaricare una fattura in formato PDF
 *    - Inviare una fattura (funzionalità in sviluppo)
 * 
 * STRUTTURA DATI:
 * - Carica i dati dalla tabella 'movimenti' filtrando per flag_sono_molitura=true e campo30='X'
 * - Recupera i dati dei clienti dalla tabella 'soggetti' per mostrare i nomi corretti
 * - Calcola importi basandosi sul prezzo molitura e sulla quantità di olio
 * 
 * FLUSSO DI LAVORO:
 * 1. L'utente può filtrare la lista di fatture per stato o con la ricerca testuale
 * 2. Per ogni fattura può visualizzare l'anteprima in PDF, scaricarla o inviarla
 * 3. Le fatture vengono generate dinamicamente usando i dati delle moliture
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/it';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import { jsPDF as jsPDFType } from 'jspdf';
// @ts-ignore
import { UserOptions } from 'jspdf-autotable';
// @ts-ignore
import autoTable from 'jspdf-autotable';

// Definizione di tipo globale per jspdf-autotable
declare global {
  interface Window {
    jspdf: any;
  }
}

// Configurazione di moment.js
moment.locale('it');

// Interfaccia per le fatture
interface Fattura {
  id: number;
  campo04: string; // data operazione
  campo05: string; // numero documento
  campo06: string; // data documento
  campo07: string; // tipo operazione
  campo08: string; // id_sian cliente
  campo24?: number | string; // Quantità olio (kg)
  id_soggetto: number;
  descrizione_soggetto?: string; // Nome del soggetto
  flag_sono_molitura: boolean;
  flag_fatturato: boolean; // Indica se la fattura è stata emessa
  costo_molitura_kg?: number | string; // Costo molitura per kg
}

// Interfaccia per le props del componente
interface FattureProps {
  companyId?: number;
  companyCode?: string;
}

const Fatture: React.FC<FattureProps> = ({ companyId, companyCode }) => {
  // Stati per gestire i dati e lo stato del componente
  const [fatture, setFatture] = useState<Fattura[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredFatture, setFilteredFatture] = useState<Fattura[]>([]);
  
  // Stato per il filtro di ricerca
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statoFatturaFilter, setStatoFatturaFilter] = useState<string>('tutte');
  
  // I dati reali saranno caricati dal database
  
  // Carica i dati all'avvio
  useEffect(() => {
    if (!companyId || !companyCode) {
      console.log('CompanyId o companyCode mancanti:', { companyId, companyCode });
      return;
    }

    fetchFatture();
  }, [companyId, companyCode]);
  
  // Filtra le fatture quando cambia il termine di ricerca o il filtro per stato
  useEffect(() => {
    let risultatoFiltrato = fatture;
    
    // Filtra per stato della fattura
    if (statoFatturaFilter !== 'tutte') {
      const isFatturato = statoFatturaFilter === 'fatturate';
      risultatoFiltrato = risultatoFiltrato.filter(fattura => 
        fattura.flag_fatturato === isFatturato
      );
    }
    
    // Filtra per termine di ricerca
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      risultatoFiltrato = risultatoFiltrato.filter(fattura => {
        const descSoggetto = fattura.descrizione_soggetto?.toLowerCase() || '';
        const numDocumento = fattura.campo05?.toLowerCase() || '';
        const codiceCliente = fattura.campo08?.toLowerCase() || '';
        
        return (
          descSoggetto.includes(searchTermLower) ||
          numDocumento.includes(searchTermLower) ||
          codiceCliente.includes(searchTermLower)
        );
      });
    }

    setFilteredFatture(risultatoFiltrato);
  }, [searchTerm, statoFatturaFilter, fatture]);

  // Funzione per recuperare i movimenti con flag_sono_molitura = true
  const fetchFatture = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Recupera i movimenti dalla tabella movimenti
      const movimentiResponse = await axios.get(`/api/company/${companyId}/tables/movimenti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!movimentiResponse.data.success) {
        throw new Error('Errore nel recupero dei movimenti');
      }
      
      let movimenti = movimentiResponse.data.data;
      
      // Filtra solo i movimenti che:
      // 1. Sono moliture (flag_sono_molitura = true)
      // 2. Hanno campo30 = 'X' (identifica le moliture c/terzi)
      movimenti = movimenti.filter((m: any) => 
        m.flag_sono_molitura === true && 
        m.campo30 === 'X'
      );
      
      // Carica i dati dei soggetti per la referenza
      const soggettiResponse = await axios.get(`/api/company/${companyId}/tables/soggetti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Associa i dati delle tabelle correlate
      const documentiConRiferimenti = movimenti.map((m: any) => {
        // Trova il soggetto corrispondente
        const soggetto = soggettiResponse.data.data.find((s: any) => s.id === m.id_soggetto);
        
        return {
          ...m,
          descrizione_soggetto: soggetto ? soggetto.descrizione : 'Non specificato'
        };
      });
      
      setFatture(documentiConRiferimenti);
      setFilteredFatture(documentiConRiferimenti);
      setLoading(false);
    } catch (error: any) {
      console.error('Errore nel recupero dei movimenti:', error);
      setError(error.message || 'Si è verificato un errore nel caricamento dei dati');
      setLoading(false);
    }
  };

  // Funzione per convertire un valore in numero
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  };

  // Formatta la data in formato italiano
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  // Formatta la quantità in formato kg
  const formatQuantity = (quantity: number | string) => {
    const numQuantity = toNumber(quantity);
    return numQuantity.toLocaleString('it-IT', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    }) + ' kg';
  };

  // Funzione per tornare alla pagina principale
  const handleBackToMain = () => {
    // Reindirizza l'utente alla dashboard principale
    window.location.href = '/';
  };

  // Funzione per generare una fattura come PDF
  const handleGeneraFattura = (id: number) => {
    console.log('Generazione fattura iniziata per ID:', id);
    const fattura = fatture.find(doc => doc.id === id);
    if (!fattura) {
      console.error('Fattura non trovata per ID:', id);
      alert('Fattura non trovata');
      return;
    }
    
    console.log('Fattura trovata:', fattura);
    
    try {
      // Crea un nuovo documento PDF
      console.log('Creazione jsPDF...');
      const doc = new jsPDF();
      console.log('Istanza jsPDF creata con successo');
      
      // Aggiungi intestazione
      doc.setFontSize(20);
      doc.text('FATTURA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`N. ${fattura.campo05 || fattura.id}`, 105, 30, { align: 'center' });
      doc.text(`Data: ${formatDate(fattura.campo04)}`, 105, 35, { align: 'center' });
      
      // Informazioni aziendali
      doc.setFontSize(10);
      doc.text('Frantoio Oleario', 20, 50);
      doc.text('CLOUD3 S.r.l. a Socio Unico', 20, 55);
      doc.text('P.IVA: IT02497740999', 20, 60);
      doc.text('Sede legale: Via San Vincenzo 2/6A - 16121 Genova (GE)', 20, 65);
      
      // Informazioni cliente
      doc.text('Cliente:', 20, 80);
      doc.text(`${fattura.descrizione_soggetto}`, 20, 85);
      doc.text(`Codice cliente: ${fattura.campo08 || 'N/A'}`, 20, 90);
      
      // Tabella con i dettagli
      const tableColumn = ["Descrizione", "Quantità", "Prezzo Unit.", "Imponibile"];
      
      // Calcola il prezzo usando il costo_molitura_kg se disponibile
      const prezzoUnitario = toNumber(fattura.costo_molitura_kg) || 8.50; // € per kg, default 8.50 se non specificato
      const quantitaOlio = toNumber(fattura.campo24);
      const imponibile = quantitaOlio * prezzoUnitario;
      
      // Aggiungi riga alla tabella
      const tableRows = [
        [
          "Servizio di molitura e lavorazione olive", 
          quantitaOlio.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), 
          "€ " + prezzoUnitario.toFixed(2).replace('.', ','), 
          "€ " + imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')
        ]
      ];
      
      console.log('Aggiunta della tabella usando autoTable...');
      // Aggiungi la tabella
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 105,
        theme: 'grid',
        styles: { halign: 'center' },
        headStyles: { fillColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      console.log('Tabella aggiunta con successo');
      
      // Riepilogo importi
      let startY = 180;
      doc.setFontSize(11);
      doc.text('Riepilogo:', 130, startY);
      doc.text(`Quantità olio: ${formatQuantity(quantitaOlio)}`, 130, startY + 7);
      doc.text(`Prezzo molitura: € ${prezzoUnitario.toFixed(2).replace('.', ',')} /kg`, 130, startY + 14);
      doc.text(`Totale: € ${imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',') }`, 130, startY + 21);
      
      // Stato fatturazione
      doc.setFontSize(12);
      if (fattura.flag_fatturato) {
        doc.setTextColor(0, 128, 0); // Verde per movimenti fatturati
        doc.text('FATTURATO', 40, startY + 14);
      } else {
        doc.setTextColor(220, 140, 0); // Arancione per movimenti da fatturare
        doc.text('DA FATTURARE', 40, startY + 14);
      }
      doc.setTextColor(0, 0, 0); // Ripristina il colore del testo
      
      // Note
      doc.setFontSize(10);
      doc.text('Note:', 20, 210);
      doc.text('Documento emesso ai sensi del DPR 633/72 e successive modificazioni', 20, 215);
      
      // Salva il PDF come file da scaricare
      const fileName = `Fattura_${fattura.campo05 ? fattura.campo05.replace(/\//g, '_') : fattura.id}.pdf`;
      doc.save(fileName);
      console.log('Download PDF completato');
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error);
      alert(`Si è verificato un errore durante la generazione del PDF: ${error}`);
    }
  };

  // Funzione per visualizzare la fattura in una nuova finestra
  const handleVisualizzaFattura = (id: number) => {
    console.log('Visualizzazione fattura iniziata per ID:', id);
    const fattura = fatture.find(doc => doc.id === id);
    if (!fattura) {
      console.error('Fattura non trovata per ID:', id);
      alert('Fattura non trovata');
      return;
    }
    
    try {
      // Crea un nuovo documento PDF
      console.log('Creazione jsPDF per visualizzazione...');
      const doc = new jsPDF();
      
      // Aggiungi intestazione
      doc.setFontSize(20);
      doc.text('FATTURA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`N. ${fattura.campo05 || fattura.id}`, 105, 30, { align: 'center' });
      doc.text(`Data: ${formatDate(fattura.campo04)}`, 105, 35, { align: 'center' });
      
      // Informazioni aziendali
      doc.setFontSize(10);
      doc.text('Frantoio Oleario', 20, 50);
      doc.text('CLOUD3 S.r.l. a Socio Unico', 20, 55);
      doc.text('P.IVA: IT02497740999', 20, 60);
      doc.text('Sede legale: Via San Vincenzo 2/6A - 16121 Genova (GE)', 20, 65);
      
      // Informazioni cliente
      doc.text('Cliente:', 20, 80);
      doc.text(`${fattura.descrizione_soggetto}`, 20, 85);
      doc.text(`Codice cliente: ${fattura.campo08 || 'N/A'}`, 20, 90);
      
      // Tabella con i dettagli
      const tableColumn = ["Descrizione", "Quantità", "Prezzo Unit.", "Imponibile"];
      
      // Calcola il prezzo usando il costo_molitura_kg se disponibile
      const prezzoUnitario = toNumber(fattura.costo_molitura_kg) || 8.50; // € per kg, default 8.50 se non specificato
      const quantitaOlio = toNumber(fattura.campo24);
      const imponibile = quantitaOlio * prezzoUnitario;
      
      // Aggiungi riga alla tabella
      const tableRows = [
        [
          "Servizio di molitura e lavorazione olive", 
          quantitaOlio.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), 
          "€ " + prezzoUnitario.toFixed(2).replace('.', ','), 
          "€ " + imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')
        ]
      ];
      
      // Aggiungi la tabella
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 105,
        theme: 'grid',
        styles: { halign: 'center' },
        headStyles: { fillColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Riepilogo importi
      let startY = 180;
      doc.setFontSize(11);
      doc.text('Riepilogo:', 130, startY);
      doc.text(`Quantità olio: ${formatQuantity(quantitaOlio)}`, 130, startY + 7);
      doc.text(`Prezzo molitura: € ${prezzoUnitario.toFixed(2).replace('.', ',')} /kg`, 130, startY + 14);
      doc.text(`Totale: € ${imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',') }`, 130, startY + 21);
      
      // Stato fatturazione
      doc.setFontSize(12);
      if (fattura.flag_fatturato) {
        doc.setTextColor(0, 128, 0); // Verde per movimenti fatturati
        doc.text('FATTURATO', 40, startY + 14);
      } else {
        doc.setTextColor(220, 140, 0); // Arancione per movimenti da fatturare
        doc.text('DA FATTURARE', 40, startY + 14);
      }
      doc.setTextColor(0, 0, 0); // Ripristina il colore del testo
      
      // Note
      doc.setFontSize(10);
      doc.text('Note:', 20, 210);
      doc.text('Documento emesso ai sensi del DPR 633/72 e successive modificazioni', 20, 215);
      
      // Usa blob per aprire in una nuova finestra
      console.log('Generazione blob del PDF...');
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      console.log('URL del blob creato:', blobUrl);
      
      console.log('Apertura nuova finestra con il PDF...');
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Errore durante la visualizzazione del PDF:', error);
      alert(`Si è verificato un errore durante la visualizzazione del PDF: ${error}`);
    }
  };

  // Aggiungiamo gli stili CSS per il layout responsive
  const mobileStyles = `
    @media screen and (max-width: 768px) {
      .desktop-view {
        display: none;
      }
      
      .filters-container {
        flex-direction: column;
        gap: 10px;
      }
      
      .filter-buttons {
        display: flex;
        justify-content: space-between;
        width: 100%;
      }
      
      .filter-button {
        flex: 1;
        white-space: nowrap;
        padding: 8px 5px;
        font-size: 0.9rem;
      }
      
      .search-bar {
        width: 100%;
      }
    }
    
    @media screen and (min-width: 769px) {
      .mobile-view {
        display: none;
      }
    }
    
    .fattura-cards {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 15px;
    }
    
    .fattura-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      background-color: #f5f7fa;
      border-bottom: 1px solid #e4e9f0;
    }
    
    .fattura-id {
      font-weight: bold;
      color: #444;
    }
    
    .fattura-status {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .status-fatturato {
      background-color: #e3f2e3;
      color: #2a8d2a;
    }
    
    .status-da-fatturare {
      background-color: #fff3e0;
      color: #b86e00;
    }
    
    .card-body {
      padding: 15px;
    }
    
    .card-row {
      display: flex;
      margin-bottom: 8px;
      align-items: baseline;
    }
    
    .card-label {
      font-weight: 500;
      width: 85px;
      color: #666;
      font-size: 0.9rem;
    }
    
    .card-value {
      flex: 1;
      font-size: 0.95rem;
    }
    
    .card-info-row {
      display: flex;
      margin-top: 15px;
      border-top: 1px solid #eee;
      padding-top: 12px;
    }
    
    .info-item {
      flex: 1;
      text-align: center;
    }
    
    .info-label {
      font-size: 0.8rem;
      color: #777;
      margin-bottom: 3px;
    }
    
    .info-value {
      font-weight: 600;
      font-size: 1.05rem;
      color: #333;
    }
    
    .card-actions {
      display: flex;
      border-top: 1px solid #e4e9f0;
    }
    
    .card-action-button {
      flex: 1;
      padding: 12px;
      border: none;
      background: none;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background-color 0.2s;
      color: #444;
    }
    
    .card-action-button:hover {
      background-color: #f0f3f8;
    }
    
    .view-button {
      color: #3498db;
    }
    
    .download-button {
      color: #2ecc71;
    }
    
    .send-button {
      color: #9b59b6;
    }
    
    .no-results-mobile {
      text-align: center;
      padding: 30px 15px;
      background: #f9f9f9;
      border-radius: 8px;
      color: #777;
      margin-top: 15px;
    }
  `;

  // Rendering della pagina
  return (
    <div className="documenti-trasporto-container">
      {/* Aggiungiamo gli stili in-line per il supporto mobile */}
      <style>{mobileStyles}</style>
      
      <div className="page-header">
        <div className="header-left-buttons">
          <button 
            className="back-button"
            onClick={handleBackToMain}
          >
            <i className="fas fa-arrow-left"></i> Torna alla Home
          </button>
        </div>
        <h2>Fatture</h2>
        <div className="subtitle">Gestione e visualizzazione fatture emesse e ricevute</div>
      </div>

      {/* Filtri e barra di ricerca */}
      <div className="filters-container">
        <div className="filter-buttons">
          <button 
            className={`filter-button ${statoFatturaFilter === 'tutte' ? 'active' : ''}`}
            onClick={() => setStatoFatturaFilter('tutte')}
          >
            Tutti
          </button>
          <button 
            className={`filter-button ${statoFatturaFilter === 'fatturate' ? 'active' : ''}`}
            onClick={() => setStatoFatturaFilter('fatturate')}
          >
            Fatturate
          </button>
          <button 
            className={`filter-button ${statoFatturaFilter === 'non_fatturate' ? 'active' : ''}`}
            onClick={() => setStatoFatturaFilter('non_fatturate')}
          >
            Da fatturare
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca per cliente, numero fattura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search"
            >
              ✕
            </button>
          )}
          <div className="search-results">
            {searchTerm && `${filteredFatture.length} fatture trovate`}
          </div>
        </div>
      </div>

      {/* Mostra messaggio di caricamento o errore */}
      {loading && <div className="loading">Caricamento fatture in corso...</div>}
      {error && <div className="error-message">Errore: {error}</div>}
      
      {/* Tabella dei movimenti di molitura - versione desktop */}
      {!loading && !error && (
        <>
          {/* Vista desktop - tabella tradizionale */}
          <div className="documenti-table desktop-view">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>N° Doc</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Cod. Cliente</th>
                  <th>Kg Olio</th>
                  <th>€/Kg</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredFatture.length > 0 ? (
                  filteredFatture.map(fattura => (
                    <tr key={fattura.id}>
                      <td>{fattura.id}</td>
                      <td>
                        <span className="badge badge-primary">
                          {fattura.campo07 || "T3"}
                        </span>
                      </td>
                      <td>{fattura.campo05 || "-"}</td>
                      <td>{formatDate(fattura.campo04)}</td>
                      <td>{fattura.descrizione_soggetto}</td>
                      <td>{fattura.campo08 || "-"}</td>
                      <td>{fattura.campo24 ? formatQuantity(fattura.campo24) : "-"}</td>
                      <td>{fattura.costo_molitura_kg ? toNumber(fattura.costo_molitura_kg).toFixed(2).replace('.', ',') + " €" : "-"}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="action-button"
                            onClick={() => handleVisualizzaFattura(fattura.id)}
                            title="Visualizza documento"
                          >
                            <i className="fas fa-file-pdf"></i> Visualizza
                          </button>
                          <button 
                            className="action-button download-button"
                            onClick={() => handleGeneraFattura(fattura.id)}
                            title="Scarica documento"
                          >
                            <i className="fas fa-download"></i> Scarica
                          </button>
                          <button 
                            className="action-button send-button"
                            onClick={() => alert('In attesa di connessione...')}
                            title="Invia documento"
                          >
                            <i className="fas fa-paper-plane"></i> Invia
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="no-records">
                      {searchTerm || statoFatturaFilter !== 'tutte'
                        ? 'Nessun documento corrisponde ai criteri di ricerca' 
                        : 'Nessun documento disponibile'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Vista mobile - card design */}
          <div className="mobile-view">
            {filteredFatture.length > 0 ? (
              <div className="fattura-cards">
                {filteredFatture.map(fattura => (
                  <div key={fattura.id} className="fattura-card">
                    <div className="card-header">
                      <span className="fattura-id">#{fattura.id}</span>
                      {fattura.flag_fatturato && (
                        <span className="fattura-status status-fatturato">
                          Fatturato
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="card-row">
                        <div className="card-label">Cliente:</div>
                        <div className="card-value">{fattura.descrizione_soggetto}</div>
                      </div>
                      <div className="card-row">
                        <div className="card-label">Documento:</div>
                        <div className="card-value">
                          <span className="badge badge-primary">{fattura.campo07 || "T3"}</span> {fattura.campo05 || "N/D"}
                        </div>
                      </div>
                      <div className="card-row">
                        <div className="card-label">Data:</div>
                        <div className="card-value">{formatDate(fattura.campo04)}</div>
                      </div>
                      <div className="card-info-row">
                        <div className="info-item">
                          <div className="info-label">Kg Olio</div>
                          <div className="info-value">{fattura.campo24 ? formatQuantity(fattura.campo24) : "-"}</div>
                        </div>
                        <div className="info-item">
                          <div className="info-label">Prezzo</div>
                          <div className="info-value">{fattura.costo_molitura_kg ? toNumber(fattura.costo_molitura_kg).toFixed(2).replace('.', ',') + " €/kg" : "-"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="card-action-button view-button"
                        onClick={() => handleVisualizzaFattura(fattura.id)}
                      >
                        <i className="fas fa-file-pdf"></i>
                      </button>
                      <button 
                        className="card-action-button download-button"
                        onClick={() => handleGeneraFattura(fattura.id)}
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button 
                        className="card-action-button send-button"
                        onClick={() => alert('In attesa di connessione...')}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results-mobile">
                {searchTerm || statoFatturaFilter !== 'tutte'
                  ? 'Nessun documento corrisponde ai criteri di ricerca' 
                  : 'Nessun documento disponibile'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Fatture;