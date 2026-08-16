import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { RentalProvider } from './state/RentalProvider';
import './i18n';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

createRoot(container).render(
  <StrictMode>
    {/* Hash routing keeps deep links working from any static host, subpath and all. */}
    <HashRouter>
      <RentalProvider>
        <App />
      </RentalProvider>
    </HashRouter>
  </StrictMode>,
);
