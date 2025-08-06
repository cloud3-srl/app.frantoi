import React, { useState } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Link, useParams } from 'react-router-dom';

// Configurazione di moment.js
moment.locale('it');

// Definiamo i tipi per gli eventi del calendario
interface Evento {
  id: number;
  title: string;
  start: Date;
  end: Date;
  desc?: string;
  categoria?: string;
  risorse?: string[];
  lineaColor?: string; // Colore associato alla linea
}

// Configurazione dei messaggi in italiano
const messages = {
  allDay: 'Tutto il giorno',
  previous: 'Precedente',
  next: 'Successivo',
  today: 'Oggi',
  month: 'Mese',
  week: 'Settimana',
  day: 'Giorno',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Ora',
  event: 'Evento',
  noEventsInRange: 'Nessun evento in questo periodo',
  showMore: (total: number) => `+ Mostra altri (${total})`
};

// Inizializza il localizer
const localizer = momentLocalizer(moment);

// Eventi di esempio per il calendario (7 giorni intorno alla data corrente)
const getEventiDemo = (): Evento[] => {
  const now = new Date();
  
  return [
    {
      id: 1,
      title: 'Conferimento Olive',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 9, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0),
      desc: 'Conferimento da Azienda Agricola Rossi',
      categoria: 'conferimento',
      risorse: ['Operatore 1']
    },
    {
      id: 2,
      title: 'Molitura',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 30),
      desc: 'Molitura partita #145',
      categoria: 'molitura',
      risorse: ['Operatore 2', 'Macchinario 1']
    },
    {
      id: 3,
      title: 'Vendita Olio',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
      desc: 'Vendita al cliente Mario Bianchi',
      categoria: 'vendita',
      risorse: ['Operatore 3']
    },
    {
      id: 4,
      title: 'Manutenzione',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 17, 0),
      desc: 'Manutenzione programmata macchine',
      categoria: 'manutenzione',
      risorse: ['Tecnico 1', 'Tecnico 2']
    },
    {
      id: 5,
      title: 'Ispezione ICQRF',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 11, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 13, 0),
      desc: 'Visita ispettiva ICQRF programmata',
      categoria: 'ispezione',
      risorse: ['Responsabile Qualità']
    }
  ];
};

// Funzione per definire colori in base alla categoria e alla linea
const getEventStyle = (event: Evento) => {
  // Colore di base basato sulla categoria
  let backgroundColor = event.categoria === 'conferimento' ? '#34b734' :
                        event.categoria === 'molitura' ? '#3474eb' :
                        event.categoria === 'vendita' ? '#eb9834' :
                        event.categoria === 'manutenzione' ? '#eb4034' :
                        event.categoria === 'ispezione' ? '#a834eb' : '#63666A';
  
  // Se l'evento ha un colore associato alla linea, utilizziamolo come colore di sfondo
  if (event.lineaColor) {
    backgroundColor = event.lineaColor;
  }
  
  return {
    style: {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      padding: '2px 5px',
      fontWeight: 500
    }
  };
};

// Componente per il popup di dettaglio evento
const EventDetails: React.FC<{event: Evento, onClose: () => void}> = ({ event, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '5px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      zIndex: 1000,
      maxWidth: '400px',
      width: '100%'
    }}>
      <h3>{event.title}</h3>
      <p><strong>Data:</strong> {moment(event.start).format('DD/MM/YYYY')}</p>
      <p><strong>Orario:</strong> {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</p>
      {event.desc && <p><strong>Descrizione:</strong> {event.desc}</p>}
      {event.categoria && <p><strong>Categoria:</strong> {event.categoria}</p>}
      {event.risorse && (
        <p>
          <strong>Risorse:</strong> {event.risorse.join(', ')}
        </p>
      )}
      <div style={{textAlign: 'right', marginTop: '20px'}}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a86e8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};

const CalendarioAttivita: React.FC = () => {
  const [events] = useState<Evento[]>(getEventiDemo());
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { companyCode } = useParams<{ companyCode: string }>();

  const handleSelectEvent = (event: Evento) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    // Funzionalità per aggiungere un nuovo evento in futuro
    console.log('Selezione slot:', { start, end });
  };

  return (
    <div style={{ height: '700px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Calendario Attività Frantoio</h2>
        <Link 
          to={`/company/${companyCode}/operations/prenotazioni-viewer`}
          className="btn btn-primary"
          style={{ 
            backgroundColor: '#4a86e8', 
            border: 'none', 
            padding: '8px 15px',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fas fa-list-alt"></i>
          Visualizza Prenotazioni
        </Link>
      </div>
      
      <div style={{ height: 'calc(100% - 50px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          step={60}
          showMultiDayTimes
          messages={messages}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={getEventStyle}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
        />
      </div>
      
      {selectedEvent && (
        <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default CalendarioAttivita;