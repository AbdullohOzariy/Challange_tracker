import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DesignHome from './pages/DesignHome';
import { AppProvider } from './context/AppContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const urlParams = new URLSearchParams(window.location.search);
const useDesign = urlParams.get('design') === '1';

root.render(
  <React.StrictMode>
    <AppProvider>
      {useDesign ? <DesignHome /> : <App />}
    </AppProvider>
  </React.StrictMode>
);
