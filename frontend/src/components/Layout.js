// Layout.js
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const h = React.createElement;

export default function Layout({ children }) {
  return h('div', { className: 'app-layout' },
    h(Navbar),
    h('div', { className: 'app-container d-flex' },
      h(Sidebar),
      h('main', { 
        className: 'app-main'
      }, 
        children
      )
    )
  );
}