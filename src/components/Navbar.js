import React from 'react';
import { Link } from 'react-router-dom';

const h = React.createElement;

export default function Navbar() {
  return h('nav', { className: 'navbar app-header navbar-expand px-3' },
    h('div', { className: 'container-fluid' },
      // Brand only
      h(Link, { to: '/', className: 'navbar-brand fw-semibold d-flex align-items-center' },
        h('span', { className: 'brand-gradient' }, 'HYDRO INDEX')
      )
    )
  );
}
