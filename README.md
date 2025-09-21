# 🏢 WindBorne Vendor Dashboard

A professional financial analysis dashboard for evaluating potential suppliers using Alpha Vantage API. Built for WindBorne's engineering challenge.

![Dashboard Preview](https://img.shields.io/badge/Status-Complete-brightgreen) ![React](https://img.shields.io/badge/React-18.x-blue) ![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)

## ✨ Features

- **📊 Vendor Comparison**: Compare 5 potential suppliers (TEL, ST, DD, CE, LYB)
- **📈 Multiple Data Sources**: Uses Alpha Vantage OVERVIEW, INCOME_STATEMENT, and BALANCE_SHEET endpoints
- **🎯 Interactive Charts**: Revenue and profit visualization with Chart.js
- **🚩 Smart Flagging**: Automatically flags vendors with concerning financial metrics
- **📥 CSV Export**: Export comparison data for further analysis
- **💾 SQLite Caching**: 24-hour caching to respect API rate limits
- **🔍 Detailed Views**: Drill down into individual company financials
- **🎨 Professional Design**: Sleek, business-ready interface with modern styling

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Alpha Vantage API key (free at [alphavantage.co](https://www.alphavantage.co/support/#api-key))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/windborne-vendor-dashboard.git
   cd windborne-vendor-dashboard
   ```

2. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Alpha Vantage API key
   ```

4. **Start the Application**:
   ```bash
   npm run dev
   ```

5. **Access Dashboard**:
   - 🌐 Frontend: http://localhost:3000
   - 🔧 Backend API: http://localhost:5000/api

## 📱 Usage

1. **Load Data**: Click "Fetch Latest Data" to load financial data for all vendors (~15 seconds)
2. **Analyze**: View the comparison table and interactive charts
3. **Deep Dive**: Click "View Details" on any company for comprehensive financial analysis
4. **Export**: Use "Export to CSV" button for further analysis
5. **Monitor**: Red flags automatically highlight financial concerns

## 🏭 Vendor Companies

### Sensors
- **TE Connectivity (TEL)** - Electronic components and connectivity solutions
- **Sensata Technologies (ST)** - Sensors and electrical protection components

### Plastics/Materials
- **DuPont de Nemours (DD)** - Specialty materials and chemicals
- **Celanese (CE)** - Chemical and specialty materials
- **LyondellBasell (LYB)** - Plastics, chemicals, and refining

## 🛠 Technical Stack

- **Backend**: Node.js, Express.js, SQLite3, Axios
- **Frontend**: React, Chart.js, React Chart.js 2, PapaParse
- **API**: Alpha Vantage Fundamental Data
- **Styling**: Custom CSS with modern gradients and animations
- **Database**: SQLite (file-based, no setup required)

## 📡 API Endpoints

```
GET /api/vendors                     # List all vendor companies
GET /api/company/:symbol/overview    # Company overview data
GET /api/company/:symbol/income      # Income statement data
GET /api/company/:symbol/balance     # Balance sheet data
GET /api/dashboard/comparison        # Complete dashboard data
```

## ⚡ Performance & Caching

- **Smart Caching**: 24-hour SQLite cache reduces API calls
- **Rate Limiting**: 1-second delays respect Alpha Vantage limits (5 calls/minute)
- **Timeout Handling**: 10-second timeouts prevent hanging requests
- **Error Recovery**: Graceful handling of API failures

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only
npm run install-all  # Install all dependencies
npm run build        # Build for production
```

### Project Structure

```
windborne-vendor-dashboard/
├── server/           # Backend API
│   ├── index.js     # Express server
├── client/          # React frontend
│   ├── src/
│   ├── public/
├── .env.example     # Environment template
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## 🚩 Flagging System

The dashboard automatically flags vendors with:
- **Low Profit Margin**: < 5%
- **High Debt**: Debt-to-Equity ratio > 1.5
- **Low Revenue**: < $1B annually

## 📊 Data Sources

Uses three Alpha Vantage fundamental data endpoints:
1. **OVERVIEW**: Market cap, P/E ratios, profit margins
2. **INCOME_STATEMENT**: Revenue, profits, expenses over time
3. **BALANCE_SHEET**: Assets, liabilities, financial stability

## 🔒 Security

- ✅ API keys secured in backend environment variables
- ✅ Never exposed to browser/frontend
- ✅ CORS protection configured
- ✅ Input validation and error handling

## 📄 License

This project was created for WindBorne's engineering challenge.

## 🤝 Contributing

This is a technical assessment project. For questions or issues, please contact the developer.

---

**Built with ❤️ for WindBorne Systems**