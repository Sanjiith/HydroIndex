import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SingleSample from './pages/SingleSample';
import BatchProcessing from './pages/BatchProcessing';
import Historical from './pages/Historical';
import Reports from './pages/Reports';
import DataManagement from './pages/DataManagement';




const h = React.createElement;

export default function App() {
  return h(BrowserRouter, null,
    h('div', { className: 'app-shell' },
      h('div', { className: 'app-header' }, h(Navbar)),
      h(Sidebar),
      h('main', { className: 'app-main container-fluid' },
        h(Routes, null,
          h(Route, { path: '/', element: h(Dashboard, null) }),
          h(Route, { path: '/single', element: h(SingleSample, null) }),
          h(Route, { path: '/batch', element: h(BatchProcessing, null) }),
          h(Route, { path: '/historical', element: h(Historical, null) }),
          h(Route, { path: '/reports', element: h(Reports, null) }),
          h(Route, { path: '/data', element: h(DataManagement, null) })
        )
      )
    )
  );
}
