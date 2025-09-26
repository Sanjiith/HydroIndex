import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const h = React.createElement;

const links = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2' },
  { to: '/single', label: 'Single Sample', icon: 'bi-droplet' },
  { to: '/batch', label: 'Batch Processing', icon: 'bi-upload' },
  { to: '/historical', label: 'Historical', icon: 'bi-graph-up' },
  { to: '/reports', label: 'Reports', icon: 'bi-file-earmark-pdf' },
  { to: '/data', label: 'Data', icon: 'bi-database' }
];

export default function Sidebar() {
  const location = useLocation();
  // collapsed == true means show compact (icons only) / hidden on very small screens
  const [collapsed, setCollapsed] = useState(() => {
    try {
      // auto-collapse on small screens
      return window.innerWidth < 992; // collapse for medium/smaller viewports
    } catch {
      return false;
    }
  });

  useEffect(() => {
    function onToggle() {
      setCollapsed(prev => !prev);
    }
    function onResize() {
      // auto collapse when width small; expand when large
      try {
        const shouldCollapse = window.innerWidth < 992;
        setCollapsed(shouldCollapse);
      } catch {}
    }
    window.addEventListener('hydro-toggle-sidebar', onToggle);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('hydro-toggle-sidebar', onToggle);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // style adjustments when collapsed
  const asideClass = `app-sidebar p-3 ${collapsed ? 'collapsed' : ''}`;

  // Minimal inline style fallback for collapsed behaviour (keeps things functional without external CSS change)
  const collapsedStyles = {
    width: collapsed ? '64px' : '',
    overflow: 'hidden'
  };

  return h('aside', { className: asideClass, style: collapsedStyles },
    h('div', { className: 'mb-3 ps-2 text-uppercase small text-muted', style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, 'Navigation'),
    ...links.map((l) =>
      h(Link, {
        to: l.to,
        key: l.to,
        className: `sidebar-link d-flex align-items-center mb-1 ${location.pathname === l.to ? 'active' : ''}`,
        title: l.label,
        style: { gap: '10px', textDecoration: 'none' }
      },
        h('i', { className: `bi ${l.icon}`, style: { minWidth: '20px', textAlign: 'center' } }),
        // hide label when collapsed
        !collapsed ? h('span', null, l.label) : null
      )
    ),
    h('hr', { className: 'text-secondary mt-3', style: { marginTop: '12px' } }),
    h('div', { className: 'ps-2 text-uppercase small text-muted', style: { marginTop: '8px' } }, 'Quick Actions'),
    h(Link, { to: '/single', className: 'sidebar-link mt-1 d-flex align-items-center', style: { gap: '10px' } },
      h('i', { className: 'bi bi-plus-circle', style: { minWidth: '20px', textAlign: 'center' } }),
      !collapsed ? ' New Analysis' : null
    )
  );
}
