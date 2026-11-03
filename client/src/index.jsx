import React from 'react';
import { createRoot } from 'react-dom/client';

// project imports
import App from './App';

// Render aplikasi utama
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);