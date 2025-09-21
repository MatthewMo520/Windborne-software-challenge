import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ vendors, companyData, loading, onFetchData, onSelectCompany }) => {
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

  const formatNumber = (value) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return num.toFixed(2);
  };

  const exportToCSV = () => {
    const csvData = Object.entries(companyData).map(([symbol, data]) => ({
      Symbol: symbol,
      Name: data.name,
      'Market Cap': data.marketCap,
      Revenue: data.revenue,
      'Gross Profit': data.grossProfit,
      'Net Income': data.netIncome,
      'P/E Ratio': data.peRatio,
      'Profit Margin': data.profitMargin,
      'Return on Equity': data.returnOnEquity,
      'Debt to Equity': data.debtToEquity,
      'Fiscal Year': data.fiscalYear,
      Flags: data.flags?.join('; ') || 'None'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vendor_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = {
    labels: Object.keys(companyData),
    datasets: [
      {
        label: 'Revenue (Billions)',
        data: Object.values(companyData).map(company =>
          company.revenue ? parseFloat(company.revenue) / 1000000000 : 0
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Gross Profit (Billions)',
        data: Object.values(companyData).map(company =>
          company.grossProfit ? parseFloat(company.grossProfit) / 1000000000 : 0
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue and Gross Profit Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <button
          onClick={onFetchData}
          disabled={loading}
          className="fetch-button"
        >
          {loading ? 'Loading...' : 'Fetch Latest Data'}
        </button>

        {Object.keys(companyData).length > 0 && (
          <button onClick={exportToCSV} className="export-button">
            Export to CSV
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <h3>Loading Vendor Financial Data</h3>
            <p>Fetching data from Alpha Vantage API...</p>
            <div className="loading-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="progress-text">This may take up to 15 seconds</p>
            </div>
          </div>
        </div>
      )}

      {Object.keys(companyData).length > 0 && (
        <>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="comparison-table">
            <h2>Vendor Comparison</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Symbol</th>
                    <th>Market Cap</th>
                    <th>Revenue</th>
                    <th>Gross Profit</th>
                    <th>Net Income</th>
                    <th>P/E Ratio</th>
                    <th>Profit Margin</th>
                    <th>ROE</th>
                    <th>Debt/Equity</th>
                    <th>Flags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(companyData).map(([symbol, data]) => (
                    <tr key={symbol} className={data.flags?.length > 0 ? 'flagged' : ''}>
                      <td>{data.name}</td>
                      <td>{symbol}</td>
                      <td>{formatCurrency(data.marketCap)}</td>
                      <td>{formatCurrency(data.revenue)}</td>
                      <td>{formatCurrency(data.grossProfit)}</td>
                      <td>{formatCurrency(data.netIncome)}</td>
                      <td>{formatNumber(data.peRatio)}</td>
                      <td>{formatPercentage(data.profitMargin)}</td>
                      <td>{formatPercentage(data.returnOnEquity)}</td>
                      <td>{formatNumber(data.debtToEquity)}</td>
                      <td>
                        {data.flags?.length > 0 ? (
                          <div className="flags">
                            {data.flags.map((flag, index) => (
                              <span key={index} className="flag">{flag}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-flags">None</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectCompany(symbol)}
                          className="details-button"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;