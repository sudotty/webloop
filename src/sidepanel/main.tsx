import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './store';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('root element not found');

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
);
