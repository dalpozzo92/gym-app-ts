import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

/* Importa le variabili CSS personalizzate PRIMA dei CSS di Ionic */
import './theme/variables.css';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import { setupIonicReact } from '@ionic/react';

// Configura Ionic con dark mode di default
setupIonicReact({
  mode: 'ios', // Per uno stile consistente su tutte le piattaforme
  animated: true,
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

// Registra Service Worker per PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nuova versione disponibile. Vuoi aggiornare?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronta per uso offline');
  },
});

const root = ReactDOM.createRoot(container);
// Rimuove StrictMode per evitare il doppio rendering
root.render(<App />);
