// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const h = React.createElement;

export default function Navbar() {
  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      // Mobile toggle
      const event = new CustomEvent('hydro-toggle-mobile-sidebar');
      window.dispatchEvent(event);
    } else {
      // Desktop toggle
      const event = new CustomEvent('hydro-toggle-sidebar');
      window.dispatchEvent(event);
    }
  };

  return h('nav', { className: 'navbar app-header navbar-expand px-3', style: { backgroundColor: '#1a1d23', borderBottom: '1px solid #2d3748' } },
    h('div', { className: 'container-fluid' },
      // Sidebar toggle button - visible on all screens
      h('button', {
        className: 'sidebar-toggle me-3',
        onClick: toggleSidebar,
        type: 'button',
        'aria-label': 'Toggle sidebar'
      }, h('i', { className: 'bi bi-list' })),
      
      // Brand
      h(Link, { 
        to: '/app/dashboard', 
        className: 'navbar-brand fw-semibold d-flex align-items-center',
        style: { textDecoration: 'none' }
      },
        h('span', { className: 'brand-gradient', style: { fontSize: '1.5rem', fontWeight: '700' } }, 'HYDRO INDEX')
      ),
      
      // Spacer
      h('div', { className: 'navbar-nav ms-auto' },
        // You can add additional navbar items here if needed
      )
    )
  );
}