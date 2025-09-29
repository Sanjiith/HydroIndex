// Sidebar.js
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserAccount from './UserAccount';
const h = React.createElement;

const links = [
  { to: '/', label: 'Homepage', icon: 'bi-house' },
  { to: '/app/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { to: '/app/single', label: 'Single Sample', icon: 'bi-droplet' },
  { to: '/app/batch', label: 'Batch Processing', icon: 'bi-upload' },
  { to: '/app/historical', label: 'Historical', icon: 'bi-graph-up' },
  { to: '/app/reports', label: 'Reports', icon: 'bi-file-earmark-pdf' },
  { to: '/app/data', label: 'Data', icon: 'bi-database' }
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.innerWidth < 992;
    } catch {
      return false;
    }
  });
  
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      if (window.innerWidth >= 992) {
        setCollapsed(prev => !prev);
      }
    }
    
    function handleMobileToggle() {
      if (window.innerWidth < 992) {
        setMobileOpen(prev => !prev);
      }
    }
    
    function handleResize() {
      try {
        const shouldCollapse = window.innerWidth < 992;
        setCollapsed(shouldCollapse);
        if (window.innerWidth >= 992) {
          setMobileOpen(false);
        }
      } catch {}
    }
    
    function handleClickOutside(event) {
      if (window.innerWidth < 992 && mobileOpen && !event.target.closest('.app-sidebar') && !event.target.closest('.sidebar-toggle')) {
        setMobileOpen(false);
      }
    }

    window.addEventListener('hydro-toggle-sidebar', handleToggle);
    window.addEventListener('hydro-toggle-mobile-sidebar', handleMobileToggle);
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('hydro-toggle-sidebar', handleToggle);
      window.removeEventListener('hydro-toggle-mobile-sidebar', handleMobileToggle);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileOpen]);

  const closeMobileSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 992;
  const sidebarClass = `app-sidebar p-3 ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`;

  return h(React.Fragment, null,
    // Mobile overlay
    isMobile && mobileOpen && 
      h('div', { 
        className: 'sidebar-overlay show',
        onClick: closeMobileSidebar
      }),
    
    h('aside', { 
      className: sidebarClass,
      style: { 
        ...(isMobile && {
          position: 'fixed',
          left: mobileOpen ? '0' : '-280px',
          zIndex: 1040,
          height: '100vh', // Changed from calc(100vh - 56px) to 100vh
          top: '0', // Changed from 56px to 0
          overflowY: 'auto',
          transition: 'left 0.3s ease-in-out' // Added smooth transition
        }),
        ...(!isMobile && {
          position: 'sticky', // Added for desktop
          top: '0',
          height: '100vh',
          overflowY: 'auto'
        })
      } 
    },
      // Navigation section
      h('div', { 
        className: 'mb-3 ps-2 text-uppercase small text-muted', 
        style: { 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          display: (collapsed && !isMobile) ? 'none' : 'block'
        } 
      }, 'Navigation'),
      
      // Navigation links
      ...links.map((l) =>
        h(Link, {
          to: l.to,
          key: l.to,
          className: `sidebar-link d-flex align-items-center mb-1 ${location.pathname === l.to ? 'active' : ''}`,
          title: l.label,
          style: { 
            gap: '12px', 
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          },
          onClick: closeMobileSidebar
        },
          h('i', { 
            className: `bi ${l.icon}`, 
            style: { 
              minWidth: '20px', 
              textAlign: 'center',
              fontSize: '1.1rem'
            } 
          }),
          (!collapsed || isMobile) && h('span', { 
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }, l.label)
        )
      ),
      
      h('hr', { 
        className: 'text-secondary mt-3', 
        style: { 
          marginTop: '12px',
          display: (collapsed && !isMobile) ? 'none' : 'block'
        } 
      }),
      
      // Quick Actions section
      h('div', { 
        className: 'ps-2 text-uppercase small text-muted', 
        style: { 
          marginTop: '8px',
          display: (collapsed && !isMobile) ? 'none' : 'block'
        } 
      }, 'Quick Actions'),
      
      // Quick action link
      h(Link, { 
        to: '/app/single', 
        className: 'sidebar-link mt-1 d-flex align-items-center', 
        style: { 
          gap: '12px',
          whiteSpace: 'nowrap'
        },
        onClick: closeMobileSidebar
      },
        h('i', { 
          className: 'bi bi-plus-circle', 
          style: { 
            minWidth: '20px', 
            textAlign: 'center',
            fontSize: '1.1rem'
          } 
        }),
        (!collapsed || isMobile) && h('span', {
          style: {
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }, 'New Analysis')
      )
    )
  );
}