import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/it';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

// Configurazione di moment.js
moment.locale('it');

// Interfaccia per i documenti di trasporto
interface DocumentoTrasporto {
  id: number;
  campo04: string; // data operazione
  campo05: string; // numero documento
  campo06: string; // data documento
  id_soggetto: number;
  descrizione_soggetto?: string; // Nome del soggetto
  campo24?: number; // Quantità olio
  flag_sono_molitura: boolean;
}

// Interfaccia per le props del componente
interface DocumentiTrasportoProps {
  companyId?: number;
  companyCode?: string;
}

const DocumentiTrasporto: React.FC<DocumentiTrasportoProps> = ({ companyId, companyCode }) => {
  // Stati per gestire i dati e lo stato del componente
  const [documenti, setDocumenti] = useState<DocumentoTrasporto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredDocumenti, setFilteredDocumenti] = useState<DocumentoTrasporto[]>([]);
  
  // Stato per il filtro di ricerca
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Carica i dati all'avvio
  useEffect(() => {
    if (!companyId || !companyCode) {
      console.log('CompanyId o companyCode mancanti:', { companyId, companyCode });
      return;
    }

    fetchDocumenti();
  }, [companyId, companyCode]);
  
  // Filtra i documenti quando cambia il termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDocumenti(documenti);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = documenti.filter(documento => {
      const descSoggetto = documento.descrizione_soggetto?.toLowerCase() || '';
      const numDocumento = documento.campo05?.toLowerCase() || '';
      
      return (
        descSoggetto.includes(searchTermLower) ||
        numDocumento.includes(searchTermLower)
      );
    });

    setFilteredDocumenti(filtered);
  }, [searchTerm, documenti]);

  // Funzione per recuperare i dati dei documenti
  const fetchDocumenti = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Recupera i documenti dalla tabella movimenti
      const movimentiResponse = await axios.get(`/api/company/${companyId}/tables/movimenti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!movimentiResponse.data.success) {
        throw new Error('Errore nel recupero dei movimenti');
      }
      
      let movimenti = movimentiResponse.data.data;
      
      // Filtra solo i movimenti con flag_sono_molitura = true
      movimenti = movimenti.filter((m: any) => 
        m.flag_sono_molitura === true
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
      
      setDocumenti(documentiConRiferimenti);
      setFilteredDocumenti(documentiConRiferimenti);
      setLoading(false);
    } catch (error: any) {
      console.error('Errore nel recupero dei documenti:', error);
      setError(error.message || 'Si è verificato un errore nel caricamento dei dati');
      setLoading(false);
    }
  };

  // Formatta la data in formato italiano
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return moment(dateString).format('DD/MM/YYYY');
  };

  // Funzione per tornare alla pagina principale
  const handleBackToMain = () => {
    // Reindirizza l'utente alla dashboard principale
    window.location.href = '/';
  };

  // Funzione per generare un documento di trasporto come PDF
  const handleGeneraDocumento = (id: number) => {
    console.log('Generazione documento iniziata per ID:', id);
    const documento = documenti.find(doc => doc.id === id);
    if (!documento) {
      console.error('Documento non trovato per ID:', id);
      alert('Documento non trovato');
      return;
    }
    
    console.log('Documento trovato:', documento);
    
    try {
      // Crea un nuovo documento PDF
      console.log('Creazione jsPDF...');
      const doc = new jsPDF();
      console.log('Istanza jsPDF creata con successo');
      
      // Aggiungi intestazione
      doc.setFontSize(20);
      doc.text('DOCUMENTO DI TRASPORTO', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`N. ${documento.campo05 || documento.id}`, 105, 30, { align: 'center' });
      doc.text(`Data: ${formatDate(documento.campo04)}`, 105, 35, { align: 'center' });
      
      // Informazioni aziendali
      doc.setFontSize(10);
      doc.text('Frantoio Oleario', 20, 50);
      doc.text('CLOUD3 S.r.l. a Socio Unico', 20, 55);
      doc.text('P.IVA: IT02497740999', 20, 60);
      doc.text('Sede legale: Via San Vincenzo 2/6A - 16121 Genova (GE)', 20, 65);
      
      // Informazioni destinatario
      doc.text('Destinatario:', 20, 80);
      doc.text(`${documento.descrizione_soggetto}`, 20, 85);
      doc.text('Causale del trasporto: Molitura conto terzi', 20, 95);
      
      // Tabella con i dettagli
      const tableColumn = ["Descrizione", "Quantità (Kg)"];
      const tableRows = [
        ["Olio di oliva", documento.campo24?.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || "0"]
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
      
      // Aggiungi altre informazioni e firme
      doc.text('Trasporto a cura del:', 20, 150);
      doc.text('□ Mittente    □ Destinatario    □ Vettore: ____________________', 60, 150);
      
      doc.text('Firma del conducente', 40, 180);
      doc.text('_________________________', 40, 190);
      
      doc.text('Firma del destinatario', 140, 180);
      doc.text('_________________________', 140, 190);
      
      doc.text('Note:', 20, 210);
      doc.text('Documento emesso ai sensi dell\'art. 1, comma 3, del D.P.R. n. 472 del 14/08/96', 20, 220);
      
      // Salva il PDF come file da scaricare
      const fileName = `DocTrasporto_${documento.id}_${documento.campo05 || ''}.pdf`;
      doc.save(fileName);
      console.log('Download PDF completato');
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error);
      alert(`Si è verificato un errore durante la generazione del PDF: ${error}`);
    }
  };

  // Funzione per visualizzare il PDF in una nuova finestra
  const handleVisualizzaDocumento = (id: number) => {
    console.log('Visualizzazione documento iniziata per ID:', id);
    const documento = documenti.find(doc => doc.id === id);
    if (!documento) {
      console.error('Documento non trovato per ID:', id);
      alert('Documento non trovato');
      return;
    }
    
    try {
      // Crea un nuovo documento PDF
      console.log('Creazione jsPDF per visualizzazione...');
      const doc = new jsPDF();
      
      // Aggiungi intestazione
      doc.setFontSize(20);
      doc.text('DOCUMENTO DI TRASPORTO', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`N. ${documento.campo05 || documento.id}`, 105, 30, { align: 'center' });
      doc.text(`Data: ${formatDate(documento.campo04)}`, 105, 35, { align: 'center' });
      
      // Informazioni aziendali
      doc.setFontSize(10);
      doc.text('Frantoio Oleario', 20, 50);
      doc.text('CLOUD3 S.r.l. a Socio Unico', 20, 55);
      doc.text('P.IVA: IT02497740999', 20, 60);
      doc.text('Sede legale: Via San Vincenzo 2/6A - 16121 Genova (GE)', 20, 65);
      
      // Informazioni destinatario
      doc.text('Destinatario:', 20, 80);
      doc.text(`${documento.descrizione_soggetto}`, 20, 85);
      doc.text('Causale del trasporto: Molitura conto terzi', 20, 95);
      
      // Tabella con i dettagli
      const tableColumn = ["Descrizione", "Quantità (Kg)"];
      const tableRows = [
        ["Olio di oliva", documento.campo24?.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || "0"]
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
      
      // Aggiungi altre informazioni e firme
      doc.text('Trasporto a cura del:', 20, 150);
      doc.text('□ Mittente    □ Destinatario    □ Vettore: ____________________', 60, 150);
      
      doc.text('Firma del conducente', 40, 180);
      doc.text('_________________________', 40, 190);
      
      doc.text('Firma del destinatario', 140, 180);
      doc.text('_________________________', 140, 190);
      
      doc.text('Note:', 20, 210);
      doc.text('Documento emesso ai sensi dell\'art. 1, comma 3, del D.P.R. n. 472 del 14/08/96', 20, 220);
      
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

  // Rendering della pagina
  return (
    <div className="documenti-trasporto-container">
      <div className="page-header">
        <div className="header-left-buttons">
          <button 
            className="back-button"
            onClick={handleBackToMain}
          >
            <i className="fas fa-arrow-left"></i> Torna alla Home
          </button>
        </div>
        <h2>Documenti di Trasporto</h2>
        <div className="subtitle">Visualizzazione documenti derivanti da moliture</div>
      </div>

      {/* Barra di ricerca */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Cerca per cliente, numero documento..."
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
          {searchTerm && `${filteredDocumenti.length} documenti trovati`}
        </div>
      </div>

      {/* Mostra messaggio di caricamento o errore */}
      {loading && <div className="loading">Caricamento documenti in corso...</div>}
      {error && <div className="error-message">Errore: {error}</div>}
      
      {/* Tabella dei documenti */}
      {!loading && !error && (
        <div className="documenti-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>N° Doc</th>
                <th>Cliente</th>
                <th>Kg Olio</th>
                <th>Documento</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocumenti.length > 0 ? (
                filteredDocumenti.map(documento => (
                  <tr key={documento.id}>
                    <td>{documento.id}</td>
                    <td>{formatDate(documento.campo04)}</td>
                    <td>{documento.campo05 || "-"}</td>
                    <td>{documento.descrizione_soggetto}</td>
                    <td>{documento.campo24?.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || "-"}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="action-button"
                          onClick={() => handleVisualizzaDocumento(documento.id)}
                          title="Visualizza documento"
                        >
                          <i className="fas fa-file-pdf"></i> Visualizza
                        </button>
                        <button 
                          className="action-button download-button"
                          onClick={() => handleGeneraDocumento(documento.id)}
                          title="Scarica documento"
                        >
                          <i className="fas fa-download"></i> Scarica
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-records">
                    {searchTerm 
                      ? 'Nessun documento corrisponde alla ricerca' 
                      : 'Nessun documento di trasporto disponibile'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentiTrasporto;