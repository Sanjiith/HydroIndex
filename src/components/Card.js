import React from 'react';
const h = React.createElement;

export default function Card(props) {
  const { title, headerRight, className, children } = props;
  return h('div', { className: `card card-shadcn mb-3 ${className || ''}` },
    h('div', { className: 'card-header d-flex justify-content-between align-items-center' },
      h('div', { className: 'fw-semibold' }, title || ''),
      headerRight || null
    ),
    h('div', { className: 'card-body' }, children)
  );
}