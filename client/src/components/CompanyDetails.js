import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:5000/api';

const CompanyDetails = ({ symbol, onBack }) => {
  const [overview, setOverview] = useState(null);
  const [income, setIncome] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanyDetails();
  }, [symbol]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, incomeRes, balanceRes] = await Promise.all([
        axios.get(`${API_BASE}/company/${symbol}/overview`),
        axios.get(`${API_BASE}/company/${symbol}/income`),
        axios.get(`${API_BASE}/company/${symbol}/balance`)
      ]);

      setOverview(overviewRes.data);
      setIncome(incomeRes.data);
      setBalance(balanceRes.data);
    } catch (err) {
      setError('Failed to fetch company details');
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  const formatPercentage = (value) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  const getRevenueChartData = () => {
    if (!income?.annualReports) return null;

    const reports = income.annualReports.slice(0, 5).reverse();

    return {
      labels: reports.map(report => report.fiscalDateEnding.substring(0, 4)),
      datasets: [
        {
          label: 'Total Revenue',
          data: reports.map(report => parseFloat(report.totalRevenue) / 1000000000),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Gross Profit',
          data: reports.map(report => parseFloat(report.grossProfit) / 1000000000),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '5-Year Revenue and Gross Profit Trend (Billions USD)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="company-details">
        <button onClick={onBack} className="back-button">← Back to Dashboard</button>
        <div className="loading">Loading company details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-details">
        <button onClick={onBack} className="back-button">← Back to Dashboard</button>
        <div className="error">{error}</div>
      </div>
    );
  }

  const latestAnnual = income?.annualReports?.[0];
  const latestBalance = balance?.annualReports?.[0];
  const chartData = getRevenueChartData();

  return (
    <div className="company-details">
      <button onClick={onBack} className="back-button">← Back to Dashboard</button>

      <div className="company-header">
        <h1>{overview?.Name} ({symbol})</h1>
        <p className="sector">{overview?.Sector} - {overview?.Industry}</p>
        <p className="description">{overview?.Description}</p>
      </div>

      <div className="details-grid">
        <div className="overview-section">
          <h2>Company Overview</h2>
          <div className="metrics-grid">
            <div className="metric">
              <label>Market Cap</label>
              <span>{formatCurrency(overview?.MarketCapitalization)}</span>
            </div>
            <div className="metric">
              <label>P/E Ratio</label>
              <span>{overview?.PERatio || 'N/A'}</span>
            </div>
            <div className="metric">
              <label>EPS</label>
              <span>{formatCurrency(overview?.EPS)}</span>
            </div>
            <div className="metric">
              <label>Dividend Yield</label>
              <span>{formatPercentage(overview?.DividendYield)}</span>
            </div>
            <div className="metric">
              <label>52 Week High</label>
              <span>{formatCurrency(overview?.['52WeekHigh'])}</span>
            </div>
            <div className="metric">
              <label>52 Week Low</label>
              <span>{formatCurrency(overview?.['52WeekLow'])}</span>
            </div>
          </div>
        </div>

        <div className="financial-section">
          <h2>Financial Performance</h2>
          <div className="metrics-grid">
            <div className="metric">
              <label>Total Revenue (Latest)</label>
              <span>{formatCurrency(latestAnnual?.totalRevenue)}</span>
            </div>
            <div className="metric">
              <label>Gross Profit</label>
              <span>{formatCurrency(latestAnnual?.grossProfit)}</span>
            </div>
            <div className="metric">
              <label>Operating Income</label>
              <span>{formatCurrency(latestAnnual?.operatingIncome)}</span>
            </div>
            <div className="metric">
              <label>Net Income</label>
              <span>{formatCurrency(latestAnnual?.netIncome)}</span>
            </div>
            <div className="metric">
              <label>Profit Margin</label>
              <span>{formatPercentage(overview?.ProfitMargin)}</span>
            </div>
            <div className="metric">
              <label>Return on Equity</label>
              <span>{formatPercentage(overview?.ReturnOnEquityTTM)}</span>
            </div>
          </div>
        </div>

        <div className="balance-section">
          <h2>Balance Sheet</h2>
          <div className="metrics-grid">
            <div className="metric">
              <label>Total Assets</label>
              <span>{formatCurrency(latestBalance?.totalAssets)}</span>
            </div>
            <div className="metric">
              <label>Total Liabilities</label>
              <span>{formatCurrency(latestBalance?.totalLiabilities)}</span>
            </div>
            <div className="metric">
              <label>Shareholders Equity</label>
              <span>{formatCurrency(latestBalance?.totalShareholderEquity)}</span>
            </div>
            <div className="metric">
              <label>Total Debt</label>
              <span>{formatCurrency(latestBalance?.shortLongTermDebtTotal)}</span>
            </div>
            <div className="metric">
              <label>Debt to Equity</label>
              <span>{overview?.DebtToEquityRatio || 'N/A'}</span>
            </div>
            <div className="metric">
              <label>Current Ratio</label>
              <span>{overview?.CurrentRatio || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {chartData && (
        <div className="chart-section">
          <h2>Historical Performance</h2>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;