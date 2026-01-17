import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initAssetPipeline } from './system/AssetPipeline'

// Inicializar Pipeline de Assets (Draco, Preloading) - Tarea Semana 2
initAssetPipeline();

// Estilos globales mínimos para el contenedor 3D
const style = document.createElement('style');
style.innerHTML = `
  body, html, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #111;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
