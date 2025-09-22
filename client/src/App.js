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
      console.log('Fetching vendors from:', `${API_BASE}/vendors`);
      const response = await axios.get(`${API_BASE}/vendors`);
      console.log('Vendors response:', response.data);
      setVendors(response.data);
    } catch (error) {
      setError('Failed to fetch vendors');
      console.error('Error fetching vendors:', error);
      console.error('API_BASE:', API_BASE);
      console.error('Full error:', error.response || error.message);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Fetching dashboard data from:', `${API_BASE}/comparison`);
      const response = await axios.get(`${API_BASE}/comparison`);
      console.log('Dashboard response keys:', Object.keys(response.data));
      console.log('First company data:', Object.values(response.data)[0]);
      setCompanyData(response.data);
    } catch (error) {
      setError('Failed to fetch company data');
      console.error('Error fetching dashboard data:', error);
      console.error('Full error:', error.response || error.message);
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
