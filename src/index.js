import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

// For GitHub Pages: basename should match the repository name
// Repository: dordabirthday
// URL: https://abdulrhmanElsawy.github.io/dordabirthday
// Basename: /dordabirthday
const basename = process.env.NODE_ENV === 'production' ? '/dordabirthday' : '';

root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
        <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
