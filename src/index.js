import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './theme.css';
import App from './App';

const h = React.createElement;
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  h(React.StrictMode, null, h(App))
);