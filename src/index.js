import React from 'react';
import ReactDOM from 'react-dom';
import { CookiesProvider } from 'react-cookie';
// Bundle Bootstrap's stylesheet locally: it used to load only from the defunct
// StackPath CDN, which left the app unstyled. Imported before the local CSS so
// application styles keep the upper hand.
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <CookiesProvider>
    <App />
  </CookiesProvider> ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
