/**
 * MolituraCterzi.tsx
 * -----------------
 * Componente per la gestione della molitura in conto terzi.
 * 
 * FUNZIONAMENTO:
 * 1. Il componente visualizza una lista di conferimenti non ancora moliti
 * 2. L'utente può selezionare uno o più conferimenti dello stesso cliente e tipo di oliva
 * 3. Una volta selezionati i conferimenti, si apre un form per registrare i dati della molitura
 * 4. Durante la molitura, l'utente può specificare:
 *    - Quantità di olio ottenuto e relativa resa
 *    - Temperatura di estrazione
 *    - Costo della molitura
 *    - Se il cliente ritira immediatamente l'olio o se va stoccato in una cisterna
 * 5. I conferimenti moliti vengono marcati come 'flag_molito = true' e non appaiono più nella lista
 *
 * NOTA: La lista mostra solo i conferimenti che hanno campo30='X' (potrebbero essere conferimenti c/terzi)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/it';

// Configurazione di moment.js
moment.locale('it');

// Interfaccia per il form di molitura
interface MolituraFormData {
  cliente_id: number;
  cliente_descrizione: string;
  oliva_id: number;
  oliva_descrizione: string;
  kg_olive_totali: number;
  olio_id: number | null;
  olio_descrizione: string | null;
  kg_olio_ottenuto: number | null;
  resa_percentuale: number | null;
  resa_valida: boolean;
  data_ora_molitura: string;
  temperatura_estrazione: number | null;
  kg_sansa_ottenuta: number | null;
  costo_molitura: number | null;
  costo_molitura_kg: number | null;
  ritiro_immediato: boolean;
  cisterna_id: string | null;
  conferimenti_ids: number[];
}

// Interfaccia per le props del componente
interface MolituraCterziProps {
  companyId?: number;
  companyCode?: string;
}

// Interfaccia per i dati del conferimento
interface Conferimento {
  id: number;
  campo04: string; // data operazione
  campo05: string; // numero documento
  campo06: string; // data documento
  id_soggetto: number;
  descrizione_soggetto?: string; // Nome del soggetto
  id_articolo_inizio: number;
  descrizione_articolo?: string; // Descrizione dell'articolo
  kg_olive_conferite?: number; // campo10
  macroarea?: number; // campo17
  descrizione_macroarea?: string;
  origispeci?: string; // campo18
  flag_bio?: boolean; // campo35
  flag_sono_conferimento: boolean;
  flag_molito: boolean;
  selected?: boolean; // Stato di selezione
  costo_molitura_kg?: number; // Costo molitura per kg
}

const MolituraCterzi: React.FC<MolituraCterziProps> = ({ companyId, companyCode }) => {
  // Stati per gestire i dati e lo stato del componente
  const [conferimenti, setConferimenti] = useState<Conferimento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredConferimenti, setFilteredConferimenti] = useState<Conferimento[]>([]);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  
  // Stato per il filtro di ricerca
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Stato per il form di molitura
  const [showMolituraForm, setShowMolituraForm] = useState<boolean>(false);
  const [molituraFormData, setMolituraFormData] = useState<MolituraFormData>({
    cliente_id: 0,
    cliente_descrizione: '',
    oliva_id: 0,
    oliva_descrizione: '',
    kg_olive_totali: 0,
    olio_id: null,
    olio_descrizione: null,
    kg_olio_ottenuto: null,
    resa_percentuale: null,
    resa_valida: true,
    data_ora_molitura: moment().format('YYYY-MM-DDTHH:mm'),
    temperatura_estrazione: null,
    kg_sansa_ottenuta: null,
    costo_molitura: null,
    costo_molitura_kg: null,
    ritiro_immediato: true,
    cisterna_id: null,
    conferimenti_ids: []
  });
  const [cisterne, setCisterne] = useState<any[]>([]);
  const [olioOptions, setOlioOptions] = useState<any[]>([]);

  // Carica i dati all'avvio
  useEffect(() => {
    if (!companyId || !companyCode) {
      console.log('CompanyId o companyCode mancanti:', { companyId, companyCode });
      return;
    }

    fetchConferimenti();
    fetchCisterne();
    fetchOlioOptions();
  }, [companyId, companyCode]);
  
  // Reset della selezione quando cambia il filtraggio
  useEffect(() => {
    // Conteggio manuale dei selezionati dopo il filtraggio
    const selectedItems = filteredConferimenti.filter(c => c.selected).length;
    setSelectedCount(selectedItems);
    setSelectionError(null);
  }, [filteredConferimenti]);

  // Filtra i conferimenti quando cambia il termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConferimenti(conferimenti);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = conferimenti.filter(conferimento => {
      const descSoggetto = conferimento.descrizione_soggetto?.toLowerCase() || '';
      const descArticolo = conferimento.descrizione_articolo?.toLowerCase() || '';
      const numDocumento = conferimento.campo05?.toLowerCase() || '';
      
      return (
        descSoggetto.includes(searchTermLower) ||
        descArticolo.includes(searchTermLower) ||
        numDocumento.includes(searchTermLower)
      );
    });

    setFilteredConferimenti(filtered);
  }, [searchTerm, conferimenti]);

  // Funzione per recuperare i dati dei conferimenti
  const fetchConferimenti = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Recupera i conferimenti dalla tabella movimenti
      const movimentiResponse = await axios.get(`/api/company/${companyId}/tables/movimenti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!movimentiResponse.data.success) {
        throw new Error('Errore nel recupero dei movimenti');
      }
      
      let movimenti = movimentiResponse.data.data;
      
      // Filtra solo i conferimenti non ancora moliti
      movimenti = movimenti.filter((m: any) => 
        m.flag_sono_conferimento === true && 
        (m.flag_molito === false || m.flag_molito === null) &&
        m.campo30 === 'X'
      );
      
      // Carica i dati dei soggetti per la referenza
      const soggettiResponse = await axios.get(`/api/company/${companyId}/tables/soggetti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Carica gli articoli (tipologie di olive)
      const articoliResponse = await axios.get(`/api/tables/articoli`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Carica le macroaree
      const macroareeResponse = await axios.get(`/api/tables/macroaree`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Associa i dati delle tabelle correlate
      const conferimentiConRiferimenti = movimenti.map((m: any) => {
        // Trova il soggetto corrispondente
        const soggetto = soggettiResponse.data.data.find((s: any) => s.id === m.id_soggetto);
        
        // Trova l'articolo corrispondente
        const articolo = articoliResponse.data.data.find((a: any) => a.id === m.id_articolo_inizio);
        
        // Trova la macroarea corrispondente - Converti m.campo17 in numero
        const macroareaId = parseInt(m.campo17);
        const macroarea = macroareeResponse.data.data.find((ma: any) => ma.id === macroareaId);
        
        console.log(`Conferimento ID: ${m.id}, campo17: ${m.campo17}, macroareaId: ${macroareaId}, macroarea trovata:`, macroarea);
        
        return {
          ...m,
          descrizione_soggetto: soggetto ? soggetto.descrizione : 'Non specificato',
          descrizione_articolo: articolo ? articolo.descrizione : 'Non specificato',
          descrizione_macroarea: macroarea ? macroarea.descrizione : 'Non specificata',
          kg_olive_conferite: parseFloat(m.campo10) || 0,
          macroarea: macroareaId,
          origispeci: m.campo18,
          flag_bio: m.campo35 === 'X'
        };
      });
      
      // Aggiungiamo il campo selected a tutti i conferimenti (inizialmente false)
      const conferimentiWithSelection = conferimentiConRiferimenti.map((c: any) => ({
        ...c,
        selected: false
      }));
      
      setConferimenti(conferimentiWithSelection);
      setFilteredConferimenti(conferimentiWithSelection);
      setLoading(false);
    } catch (error: any) {
      console.error('Errore nel recupero dei conferimenti:', error);
      setError(error.message || 'Si è verificato un errore nel caricamento dei dati');
      setLoading(false);
    }
  };

  // Formatta la data in formato italiano
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  // Carica le cisterne disponibili
  const fetchCisterne = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/company/${companyId}/tables/cisterne`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCisterne(response.data.data);
      } else {
        console.error('Errore nel recupero delle cisterne:', response.data.message);
      }
    } catch (error: any) {
      console.error('Errore nel recupero delle cisterne:', error);
    }
  };

  // Carica le opzioni per l'olio (dalla tabella articoli)
  const fetchOlioOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tables/articoli?tipologia=SF`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filtra solo gli articoli di tipo olio (SF)
        const olioArticoli = response.data.data.filter((a: any) => a.tipologia === 'SF');
        console.log("Articoli olio caricati:", olioArticoli.length);
        setOlioOptions(olioArticoli);
      } else {
        console.error('Errore nel recupero degli articoli olio:', response.data.message);
      }
    } catch (error: any) {
      console.error('Errore nel recupero degli articoli olio:', error);
    }
  };
  
  // Funzione per preparare i dati del form di molitura
  const prepareMolituraForm = () => {
    // Ottiene tutti i conferimenti selezionati
    const selectedConferimenti = conferimenti.filter(c => c.selected);
    
    if (selectedConferimenti.length === 0) return;
    
    // Prende i dati dal primo conferimento selezionato (tanto cliente e tipo olive sono gli stessi per tutti)
    const firstConferimento = selectedConferimenti[0];
    console.log("Conferimento selezionato:", firstConferimento);
    console.log("Tipo oliva (id_articolo_inizio):", firstConferimento.id_articolo_inizio);
    
    // Calcola il totale dei kg di olive
    const kgOliveTotali = selectedConferimenti.reduce((sum, c) => sum + (c.kg_olive_conferite || 0), 0);
    
    // Prendi il costo molitura per kg se presente nel primo conferimento
    const costoMolituraKg = firstConferimento.costo_molitura_kg || null;
    
    // Calcola il costo molitura totale
    const costoMolitura = costoMolituraKg ? 
      costoMolituraKg * kgOliveTotali : null;
    
    // Calcola la quantità di sansa (43% delle olive)
    const kgSansaOttenuta = kgOliveTotali * 0.43;
    
    // Prepara i dati per il form
    setMolituraFormData({
      cliente_id: firstConferimento.id_soggetto,
      cliente_descrizione: firstConferimento.descrizione_soggetto || '',
      oliva_id: firstConferimento.id_articolo_inizio,
      oliva_descrizione: firstConferimento.descrizione_articolo || '',
      kg_olive_totali: kgOliveTotali,
      olio_id: null,
      olio_descrizione: null,
      kg_olio_ottenuto: null,
      resa_percentuale: null,
      resa_valida: true,
      data_ora_molitura: moment().format('YYYY-MM-DDTHH:mm'),
      temperatura_estrazione: null,
      kg_sansa_ottenuta: kgSansaOttenuta,
      costo_molitura: costoMolitura,
      costo_molitura_kg: costoMolituraKg,
      ritiro_immediato: true,
      cisterna_id: null,
      conferimenti_ids: selectedConferimenti.map(c => c.id)
    });
    
    // Mostra il form
    setShowMolituraForm(true);
    
    // Verifica se esiste una relazione olive_to_oli per questo tipo di oliva
    fetchDefaultOlioForOlive(firstConferimento.id_articolo_inizio);
  };
  
  // Recupera l'olio predefinito per questo tipo di olive
  const fetchDefaultOlioForOlive = (oliveId: number) => {
    try {
      console.log("Cerco relazione olive-olio per oliva ID:", oliveId);
      const token = localStorage.getItem('token');
      
      // Forziamo il tipo di oliva a essere un numero
      const numericOliveId = parseInt(String(oliveId), 10);
      
      if (isNaN(numericOliveId)) {
        console.error("ID oliva non valido:", oliveId);
        return;
      }
      
      console.log("Cercando relazione per oliva ID (numerico):", numericOliveId);
      
      // Prima ottengo le relazioni olive_to_oli
      axios.get(`/api/tables/olive_to_oli`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        if (response.data.success) {
          console.log("Tutte le relazioni olive-olio:", response.data.data);
          
          // Filtra per la specifica oliva
          const matchingRelations = response.data.data.filter((rel: any) => 
            parseInt(String(rel.cod_olive), 10) === numericOliveId
          );
          
          console.log("Relazioni filtrate per olive ID", numericOliveId, ":", matchingRelations);
          
          if (matchingRelations.length > 0) {
            // Cerca prima una relazione predefinita
            let olioRelation = matchingRelations.find((rel: any) => rel.flag_default);
            
            // Se non c'è una predefinita, prende la prima disponibile
            if (!olioRelation) {
              olioRelation = matchingRelations[0];
            }
            
            if (olioRelation) {
              console.log("Relazione olive-olio selezionata:", olioRelation);
              
              // Ricarica gli articoli olio per avere dati freschi
              axios.get(`/api/tables/articoli?tipologia=SF`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(articoliResponse => {
                if (articoliResponse.data.success) {
                  // Aggiorna la lista di opzioni olio
                  const olioArt = articoliResponse.data.data.filter((a: any) => a.tipologia === 'SF');
                  setOlioOptions(olioArt);
                  
                  console.log("Articoli olio disponibili:", olioArt);
                  
                  // Trova i dettagli dell'olio
                  const olioDetails = olioArt.find((o: any) => 
                    parseInt(String(o.id), 10) === parseInt(String(olioRelation.cod_olio), 10)
                  );
                  
                  console.log("Dettagli olio trovati:", olioDetails);
                  
                  if (olioDetails) {
                    setMolituraFormData(prev => ({
                      ...prev,
                      olio_id: olioRelation.cod_olio,
                      olio_descrizione: olioDetails.descrizione
                    }));
                    
                    console.log("Aggiornato form con olio:", olioDetails.descrizione);
                  } else {
                    console.warn("Olio con ID", olioRelation.cod_olio, "non trovato nella tabella articoli");
                  }
                }
              }).catch(error => {
                console.error('Errore nel caricamento degli articoli olio:', error);
              });
            }
          } else {
            console.log("Nessuna relazione olive-olio trovata per olive ID:", numericOliveId);
          }
        }
      }).catch(error => {
        console.error('Errore nel recupero della relazione olive-olio:', error);
      });
    } catch (error: any) {
      console.error('Errore nel recupero della relazione olive-olio:', error);
    }
  };
  
  // Verifica se il cliente ritira immediatamente l'olio
  const fetchClienteRitiraOlio = async (clienteId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/company/${companyId}/tables/soggetti/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const cliente = response.data.data;
        setMolituraFormData(prev => ({
          ...prev,
          ritiro_immediato: cliente.flag_cliente_ritira_olio || false
        }));
      }
    } catch (error: any) {
      console.error('Errore nel recupero delle informazioni cliente:', error);
    }
  };
  
  // Gestisce il cambio dei campi nel form di molitura
  const handleMolituraInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Per i checkbox, usa il checked invece del value
    const inputValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    // Aggiorna lo stato del form
    setMolituraFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Calcoli automatici
    if (name === 'kg_olio_ottenuto' && value) {
      const kgOlio = parseFloat(value);
      if (!isNaN(kgOlio) && molituraFormData.kg_olive_totali > 0) {
        const resa = (kgOlio / molituraFormData.kg_olive_totali) * 100;
        const resaFixed = parseFloat(resa.toFixed(2));
        
        // Verifica se la resa è nel range accettabile (8% - 20%)
        const resaValida = resaFixed >= 8 && resaFixed <= 20;
        
        setMolituraFormData(prev => ({
          ...prev,
          resa_percentuale: resaFixed,
          resa_valida: resaValida
        }));
      }
    }
    
    // Calcolo automatico del costo molitura totale quando cambia il costo al kg
    if (name === 'costo_molitura_kg' && value) {
      const costoKg = parseFloat(value);
      if (!isNaN(costoKg) && molituraFormData.kg_olive_totali > 0) {
        const costoTotale = costoKg * molituraFormData.kg_olive_totali;
        setMolituraFormData(prev => ({
          ...prev,
          costo_molitura: parseFloat(costoTotale.toFixed(2))
        }));
      }
    }
    
    // Calcolo automatico del costo molitura al kg quando cambia il costo totale
    if (name === 'costo_molitura' && value) {
      const costoTotale = parseFloat(value);
      if (!isNaN(costoTotale) && molituraFormData.kg_olive_totali > 0) {
        const costoKg = costoTotale / molituraFormData.kg_olive_totali;
        setMolituraFormData(prev => ({
          ...prev,
          costo_molitura_kg: parseFloat(costoKg.toFixed(4))
        }));
      }
    }
  };
  
  // Invia il form di molitura all'API
  const handleMolituraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepara i dati con i tipi corretti
      const cleanedData = {
        ...molituraFormData,
        conferimenti_ids: molituraFormData.conferimenti_ids.map(id => Number(id)),
        cliente_id: Number(molituraFormData.cliente_id),
        oliva_id: Number(molituraFormData.oliva_id),
        olio_id: molituraFormData.olio_id ? Number(molituraFormData.olio_id) : null,
        kg_olive_totali: Number(molituraFormData.kg_olive_totali),
        kg_olio_ottenuto: molituraFormData.kg_olio_ottenuto ? Number(molituraFormData.kg_olio_ottenuto) : null,
        ritiro_immediato: Boolean(molituraFormData.ritiro_immediato)
      };
      
      // Invia i dati all'API
      console.log("Invio dati molitura all'API:", cleanedData);
      
      console.log('Endpoint URL:', `/api/company/${companyId}/molitura`);
      
      const response = await axios.post(
        `/api/company/${companyId}/molitura`,
        cleanedData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Risposta API molitura:", response.data);
      
      if (response.data.success) {
        alert("Molitura completata con successo!");
        setShowMolituraForm(false);
        
        // Aggiorna la lista conferimenti
        fetchConferimenti();
      } else {
        throw new Error(response.data.message || 'Errore nella registrazione della molitura');
      }
    } catch (error: any) {
      console.error('Errore durante la registrazione della molitura:', error);
      alert(error.message || 'Si è verificato un errore durante la registrazione della molitura');
      setError(error.message || 'Si è verificato un errore durante la registrazione della molitura');
    }
      
  };
  
  // Gestisce la selezione di un conferimento
  const handleSelectConferimento = (conferimento: Conferimento) => {
    console.log("Gestione selezione conferimento:", conferimento.id);
    
    // Crea una copia dell'array per mantenere l'immutabilità
    const updatedConferimenti = [...conferimenti];
    const index = updatedConferimenti.findIndex(c => c.id === conferimento.id);
    
    if (index === -1) return;
    
    const updatedFilteredConferimenti = [...filteredConferimenti];
    const filteredIndex = updatedFilteredConferimenti.findIndex(c => c.id === conferimento.id);
    
    // Se stiamo deselezionando, è sempre permesso
    if (updatedConferimenti[index].selected) {
      console.log("Deselezionando conferimento:", conferimento.id);
      updatedConferimenti[index].selected = false;
      
      if (filteredIndex !== -1) {
        updatedFilteredConferimenti[filteredIndex].selected = false;
      }
      
      setConferimenti(updatedConferimenti);
      setFilteredConferimenti(updatedFilteredConferimenti);
      setSelectedCount(prevCount => prevCount - 1);
      setSelectionError(null);
      return;
    }
    
    // Se è la prima selezione, è sempre permessa
    if (selectedCount === 0) {
      console.log("Prima selezione, conferimento:", conferimento.id);
      updatedConferimenti[index].selected = true;
      
      if (filteredIndex !== -1) {
        updatedFilteredConferimenti[filteredIndex].selected = true;
      }
      
      setConferimenti(updatedConferimenti);
      setFilteredConferimenti(updatedFilteredConferimenti);
      setSelectedCount(1);
      setSelectionError(null);
      return;
    }
    
    // Altrimenti, dobbiamo controllare che il cliente e il tipo di oliva siano coerenti
    const selectedConferimento = updatedConferimenti.find(c => c.selected);
    
    if (!selectedConferimento) {
      // Caso anomalo, ma gestiamolo comunque
      console.log("Nessun conferimento selezionato trovato, selezionando:", conferimento.id);
      updatedConferimenti[index].selected = true;
      
      if (filteredIndex !== -1) {
        updatedFilteredConferimenti[filteredIndex].selected = true;
      }
      
      setConferimenti(updatedConferimenti);
      setFilteredConferimenti(updatedFilteredConferimenti);
      setSelectedCount(1);
      return;
    }
    
    // Verifica che il cliente e il tipo di oliva siano gli stessi
    if (selectedConferimento.id_soggetto !== conferimento.id_soggetto) {
      console.log("Cliente diverso:", selectedConferimento.id_soggetto, "vs", conferimento.id_soggetto);
      // Mostro il messaggio di errore
      const errorMsg = "Non è possibile selezionare conferimenti di clienti diversi";
      alert(errorMsg);
      setSelectionError(errorMsg);
      return;
    }
    
    if (selectedConferimento.id_articolo_inizio !== conferimento.id_articolo_inizio) {
      console.log("Tipo olive diverso:", selectedConferimento.id_articolo_inizio, "vs", conferimento.id_articolo_inizio);
      // Mostro il messaggio di errore
      const errorMsg = "Non è possibile selezionare conferimenti con tipi di olive diversi";
      alert(errorMsg);
      setSelectionError(errorMsg);
      return;
    }
    
    // Se arriviamo qui, la selezione è valida
    console.log("Selezione valida, conferimento:", conferimento.id);
    updatedConferimenti[index].selected = true;
    
    if (filteredIndex !== -1) {
      updatedFilteredConferimenti[filteredIndex].selected = true;
    }
    
    setConferimenti(updatedConferimenti);
    setFilteredConferimenti(updatedFilteredConferimenti);
    setSelectedCount(prevCount => prevCount + 1);
    setSelectionError(null);
  };

  // Funzione per tornare alla pagina principale
  const handleBackToMain = () => {
    // Reindirizza l'utente alla dashboard principale
    window.location.href = '/';
  };

  // Rendering della pagina
  return (
    <div className="molitura-cterzi-container">
      <div className="page-header">
        <div className="header-left-buttons">
          <button 
            className="back-button"
            onClick={handleBackToMain}
          >
            <i className="fas fa-arrow-left"></i> Torna alla Home
          </button>
        </div>
        <h2>Molitura Conto Terzi</h2>
        <div className="subtitle">Visualizzazione conferimenti da molire</div>
      </div>

      {/* Barra di ricerca */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Cerca per cliente, tipo oliva..."
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
          {searchTerm && `${filteredConferimenti.length} conferimenti trovati`}
        </div>
      </div>

      {/* Mostra messaggio di caricamento o errore */}
      {loading && <div className="loading">Caricamento conferimenti in corso...</div>}
      {error && <div className="error-message">Errore: {error}</div>}
      
      {/* Messaggio di errore per la selezione */}
      {selectionError && (
        <div className="selection-error">
          <strong>Errore di selezione:</strong> {selectionError}
        </div>
      )}
      
      {/* Informazioni sulla selezione */}
      {selectedCount > 0 && (
        <div className="selection-info">
          <span>Conferimenti selezionati: {selectedCount}</span>
        </div>
      )}
      
      {/* Tabella dei conferimenti */}
      {!loading && !error && (
        <div className="conferimenti-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Data Conferimento</th>
                <th>N° Doc</th>
                <th>Data Doc</th>
                <th>Cliente</th>
                <th>Tipo Olive</th>
                <th>Kg</th>
                <th>Macroarea</th>
                <th>Bio</th>
              </tr>
            </thead>
            <tbody>
              {filteredConferimenti.length > 0 ? (
                filteredConferimenti.map(conferimento => (
                  <tr 
                    key={conferimento.id} 
                    className={conferimento.selected ? 'selected-row' : ''}
                    onClick={() => handleSelectConferimento(conferimento)}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={conferimento.selected || false}
                        onChange={() => handleSelectConferimento(conferimento)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{conferimento.id}</td>
                    <td>{formatDate(conferimento.campo04)}</td>
                    <td>{conferimento.campo05}</td>
                    <td>{formatDate(conferimento.campo06)}</td>
                    <td>{conferimento.descrizione_soggetto}</td>
                    <td>{conferimento.descrizione_articolo}</td>
                    <td>{conferimento.kg_olive_conferite?.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                    <td>{conferimento.descrizione_macroarea}</td>
                    <td>{conferimento.flag_bio ? '✓' : '−'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="no-records">
                    {searchTerm 
                      ? 'Nessun conferimento corrisponde alla ricerca' 
                      : 'Nessun conferimento da molire disponibile'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pulsante di azione (visibile solo quando ci sono selezioni) */}
      {selectedCount > 0 && (
        <div className="molitura-action-bar">
          <button 
            className="molitura-process-button"
            onClick={prepareMolituraForm}
          >
            Procedi con la molitura ({selectedCount})
          </button>
        </div>
      )}
      
      {/* Form di molitura */}
      {showMolituraForm && (
        <div className="molitura-form-overlay">
          <div className="molitura-form-container">
            <div className="molitura-form-header">
              <h2>Registrazione Molitura</h2>
              <button 
                className="close-button"
                onClick={() => setShowMolituraForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleMolituraSubmit}>
              {/* Sezione dati conferimento */}
              <div className="form-section">
                <h3>Dati Conferimento</h3>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label>Cliente</label>
                    <div className="form-display-field">
                      {molituraFormData.cliente_descrizione}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tipo Olive</label>
                    <div className="form-display-field">
                      {molituraFormData.oliva_descrizione}
                    </div>
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label>Kg Olive Conferite</label>
                    <div className="form-display-field">
                      {(typeof molituraFormData.kg_olive_totali === 'number' ? molituraFormData.kg_olive_totali.toFixed(0) : '0')} kg
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Numero Conferimenti</label>
                    <div className="form-display-field">
                      {molituraFormData.conferimenti_ids.length}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sezione dati molitura */}
              <div className="form-section">
                <h3>Dati Molitura</h3>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label htmlFor="data_ora_molitura">Data e Ora Molitura</label>
                    <input
                      type="datetime-local"
                      id="data_ora_molitura"
                      name="data_ora_molitura"
                      value={molituraFormData.data_ora_molitura}
                      onChange={handleMolituraInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Sezione produzione */}
              <div className="form-section">
                <h3>Produzione</h3>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label htmlFor="olio_id">Tipo Olio Prodotto</label>
                    <select
                      id="olio_id"
                      name="olio_id"
                      value={molituraFormData.olio_id || ''}
                      onChange={handleMolituraInputChange}
                      required
                    >
                      <option value="">Seleziona un tipo di olio...</option>
                      {olioOptions.map(olio => (
                        <option key={olio.id} value={olio.id}>
                          {olio.descrizione}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="temperatura_estrazione">Temperatura Estrazione (°C)</label>
                    <input
                      type="number"
                      id="temperatura_estrazione"
                      name="temperatura_estrazione"
                      value={molituraFormData.temperatura_estrazione || ''}
                      onChange={handleMolituraInputChange}
                      min="0"
                      max="50"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label htmlFor="kg_olio_ottenuto">
                      Kg Olio Ottenuto
                    </label>
                    <input
                      type="number"
                      id="kg_olio_ottenuto"
                      name="kg_olio_ottenuto"
                      value={molituraFormData.kg_olio_ottenuto || ''}
                      onChange={handleMolituraInputChange}
                      min={molituraFormData.kg_olive_totali ? molituraFormData.kg_olive_totali * 0.08 : 0}
                      max={molituraFormData.kg_olive_totali ? molituraFormData.kg_olive_totali * 0.2 : 100}
                      step="0.01"
                      required
                      className={molituraFormData.kg_olio_ottenuto !== null ? 
                        (molituraFormData.resa_valida ? 'valid-input' : 'invalid-input') : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="resa_percentuale">
                      Resa (%)
                      {molituraFormData.resa_percentuale !== null && (
                        molituraFormData.resa_valida ? 
                          <span className="valid-resa"> ✓</span> : 
                          <span className="invalid-resa"> ✗ (deve essere tra 8% e 20%)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      id="resa_percentuale"
                      name="resa_percentuale"
                      value={molituraFormData.resa_percentuale || ''}
                      onChange={handleMolituraInputChange}
                      readOnly
                      className={molituraFormData.resa_percentuale !== null ? 
                        (molituraFormData.resa_valida ? 'valid-input' : 'invalid-input') : ''}
                    />
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label htmlFor="kg_sansa_ottenuta">Kg Sansa Ottenuta</label>
                    <input
                      type="number"
                      id="kg_sansa_ottenuta"
                      name="kg_sansa_ottenuta"
                      value={molituraFormData.kg_sansa_ottenuta || ''}
                      onChange={handleMolituraInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sezione destinazione e costi */}
              <div className="form-section">
                <h3>Destinazione e Costi</h3>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label htmlFor="ritiro_immediato">Ritiro Immediato</label>
                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="ritiro_immediato"
                        name="ritiro_immediato"
                        checked={molituraFormData.ritiro_immediato}
                        onChange={handleMolituraInputChange}
                      />
                      <label htmlFor="ritiro_immediato">Il cliente ritira subito l'olio</label>
                    </div>
                  </div>
                  {!molituraFormData.ritiro_immediato && (
                    <div className="form-group">
                      <label htmlFor="cisterna_id">Cisterna di Destinazione</label>
                      <select
                        id="cisterna_id"
                        name="cisterna_id"
                        value={molituraFormData.cisterna_id || ''}
                        onChange={handleMolituraInputChange}
                        required
                      >
                        <option value="">Seleziona cisterna...</option>
                        {cisterne.map(cisterna => (
                          <option key={cisterna.id} value={cisterna.id}>
                            {cisterna.descrizione} 
                            {cisterna.giacenza ? ` (${cisterna.giacenza} kg)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label htmlFor="costo_molitura_kg">Costo Molitura al Kg (€)</label>
                    <input
                      type="number"
                      id="costo_molitura_kg"
                      name="costo_molitura_kg"
                      value={molituraFormData.costo_molitura_kg || ''}
                      onChange={handleMolituraInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="costo_molitura">Costo Molitura Totale (€)</label>
                    <input
                      type="number"
                      id="costo_molitura"
                      name="costo_molitura"
                      value={molituraFormData.costo_molitura || ''}
                      onChange={handleMolituraInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Pulsanti del form */}
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Registra Molitura
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowMolituraForm(false)}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MolituraCterzi;