import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import CompanyDetails from './components/CompanyDetails';
import './App.css';

const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:5000/api';

function App() {
  const [vendors, setVendors] = useState({});
  const [companyData, setCompanyData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_BASE}/vendors`);
      setVendors(response.data);
    } catch (error) {
      setError('Failed to fetch vendors');
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/dashboard/comparison`);
      setCompanyData(response.data);
    } catch (error) {
      setError('Failed to fetch company data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>WindBorne Vendor Dashboard</h1>
        <p>Financial Analysis of Potential Suppliers</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!selectedCompany ? (
        <Dashboard
          vendors={vendors}
          companyData={companyData}
          loading={loading}
          onFetchData={fetchDashboardData}
          onSelectCompany={setSelectedCompany}
        />
      ) : (
        <CompanyDetails
          symbol={selectedCompany}
          onBack={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}

export default App;
