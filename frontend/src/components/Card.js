import React from 'react';
const h = React.createElement;

export default function Card(props) {
  const { 
    title, 
    headerRight, 
    className = '', 
    children, 
    variant = 'default',
    padding = true 
  } = props;

  // Define CSS classes based on variant
  const getCardClasses = () => {
    const baseClasses = 'card mb-3';
    
    switch (variant) {
      case 'dark':
        return `${baseClasses} bg-dark text-white border-secondary ${className}`;
      case 'primary':
        return `${baseClasses} bg-primary text-white ${className}`;
      case 'secondary':
        return `${baseClasses} bg-secondary text-white ${className}`;
      case 'success':
        return `${baseClasses} bg-success text-white ${className}`;
      case 'warning':
        return `${baseClasses} bg-warning text-dark ${className}`;
      case 'danger':
        return `${baseClasses} bg-danger text-white ${className}`;
      case 'info':
        return `${baseClasses} bg-info text-dark ${className}`;
      default:
        return `${baseClasses} bg-dark text-white border-secondary ${className}`;
    }
  };

  const getHeaderClasses = () => {
    switch (variant) {
      case 'dark':
        return 'card-header bg-dark border-secondary d-flex justify-content-between align-items-center';
      case 'primary':
        return 'card-header bg-primary border-primary d-flex justify-content-between align-items-center';
      case 'secondary':
        return 'card-header bg-secondary border-secondary d-flex justify-content-between align-items-center';
      case 'success':
        return 'card-header bg-success border-success d-flex justify-content-between align-items-center';
      case 'warning':
        return 'card-header bg-warning border-warning d-flex justify-content-between align-items-center';
      case 'danger':
        return 'card-header bg-danger border-danger d-flex justify-content-between align-items-center';
      case 'info':
        return 'card-header bg-info border-info d-flex justify-content-between align-items-center';
      default:
        return 'card-header bg-dark border-secondary d-flex justify-content-between align-items-center';
    }
  };

  return h('div', { className: getCardClasses() },
    title && h('div', { className: getHeaderClasses() },
      h('h5', { className: 'card-title mb-0 fw-semibold' }, title),
      headerRight || null
    ),
    h('div', { className: `card-body ${padding ? 'p-3' : 'p-0'}` }, children)
  );
}

// Additional specialized card components
export function MetricCard(props) {
  const { title, value, subtitle, badge, className = '' } = props;
  
  return h('div', { className: `card bg-dark text-white ${className}` },
    h('div', { className: 'card-body text-center' },
      h('h6', { className: 'card-subtitle mb-2 text-muted' }, title),
      h('h3', { className: 'card-title text-brand mb-1' }, value || '0.00'),
      subtitle && h('p', { className: 'card-text small text-muted mb-1' }, subtitle),
      badge && h('span', { className: `badge bg-${badge.color || 'secondary'} mt-1` }, badge.text)
    )
  );
}

export function StatsCard(props) {
  const { title, value, description, icon, color = 'primary', className = '' } = props;
  
  return h('div', { className: `card bg-${color} text-white ${className}` },
    h('div', { className: 'card-body' },
      h('div', { className: 'row align-items-center' },
        h('div', { className: 'col' },
          h('h5', { className: 'card-title' }, title),
          h('h2', { className: 'card-text' }, value || '0'),
          description && h('p', { className: 'card-text mb-0' }, description)
        ),
        icon && h('div', { className: 'col-auto' },
          h('i', { className: `${icon} display-4 opacity-50` })
        )
      )
    )
  );
}