import React from 'react';
import { useParams } from 'react-router-dom';
import GenericTable from './GenericTable';
import GenericArticles from '../GenericArticles';
import OliveToOliRelations from '../OliveToOliRelations';

const TablePage: React.FC = () => {
  // Ottieni il nome della tabella dai parametri dell'URL
  const { tableName } = useParams<{ tableName: string }>();
  
  if (!tableName) {
    return <div>Tabella non specificata</div>;
  }
  
  const handleBack = () => {
    window.location.href = '/admin/tables';
  };
  
  // Renderizza componenti specifici per alcune tabelle
  switch (tableName) {
    case 'articoli':
      return <GenericArticles onBack={handleBack} />;
    case 'olive_to_oli':
      return <OliveToOliRelations onBack={handleBack} />;
    default:
      // Per le altre tabelle usa il componente generico
      return <GenericTable tableName={tableName} />;
  }
};

export default TablePage;