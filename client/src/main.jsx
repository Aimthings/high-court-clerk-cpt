import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/app.css';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Hydrate prerendered HTML if present; otherwise mount fresh (dev).
if (root.hasChildNodes() && root.firstElementChild) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
