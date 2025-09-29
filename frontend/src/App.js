// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SingleSample from './pages/SingleSample';
import BatchProcessing from './pages/BatchProcessing';
import Historical from './pages/Historical';
import Reports from './pages/Reports';
import DataManagement from './pages/DataManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page without layout */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth routes without layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* App routes with layout */}
        <Route path="/app/*" element={
          <Layout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="single" element={<SingleSample />} />
              <Route path="batch" element={<BatchProcessing />} />
              <Route path="historical" element={<Historical />} />
              <Route path="reports" element={<Reports />} />
              <Route path="data" element={<DataManagement />} />
              {/* Default redirect to dashboard */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;