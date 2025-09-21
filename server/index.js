const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./vendor_data.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS company_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    data_type TEXT,
    data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, data_type)
  )`);
});

const VENDORS = {
  'TEL': 'TE Connectivity',
  'ST': 'Sensata Technologies',
  'DD': 'DuPont de Nemours',
  'CE': 'Celanese',
  'LYB': 'LyondellBasell'
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchFromAlphaVantage(endpoint, symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }

  const url = `https://www.alphavantage.co/query?function=${endpoint}&symbol=${symbol}&apikey=${apiKey}`;

  try {
    console.log(`🔄 Making API call: ${endpoint} for ${symbol}`);
    const response = await axios.get(url, { timeout: 10000 }); // 10 second timeout
    console.log(`✅ API call successful: ${endpoint} for ${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint} for ${symbol}:`, error.message);
    throw error;
  }
}

function getCachedData(symbol, dataType) {
  return new Promise((resolve, reject) => {
    const query = `SELECT data, timestamp FROM company_data WHERE symbol = ? AND data_type = ?`;
    db.get(query, [symbol, dataType], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        const cacheAge = Date.now() - new Date(row.timestamp).getTime();
        if (cacheAge < CACHE_DURATION) {
          resolve(JSON.parse(row.data));
          return;
        }
      }
      resolve(null);
    });
  });
}

function setCachedData(symbol, dataType, data) {
  return new Promise((resolve, reject) => {
    const query = `INSERT OR REPLACE INTO company_data (symbol, data_type, data) VALUES (?, ?, ?)`;
    db.run(query, [symbol, dataType, JSON.stringify(data)], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

app.get('/api/vendors', (req, res) => {
  res.json(VENDORS);
});

app.get('/api/company/:symbol/overview', async (req, res) => {
  const { symbol } = req.params;

  try {
    let data = await getCachedData(symbol, 'overview');

    if (!data) {
      data = await fetchFromAlphaVantage('OVERVIEW', symbol);
      await setCachedData(symbol, 'overview', data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/company/:symbol/income', async (req, res) => {
  const { symbol } = req.params;

  try {
    let data = await getCachedData(symbol, 'income');

    if (!data) {
      data = await fetchFromAlphaVantage('INCOME_STATEMENT', symbol);
      await setCachedData(symbol, 'income', data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/company/:symbol/balance', async (req, res) => {
  const { symbol } = req.params;

  try {
    let data = await getCachedData(symbol, 'balance');

    if (!data) {
      data = await fetchFromAlphaVantage('BALANCE_SHEET', symbol);
      await setCachedData(symbol, 'balance', data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/comparison', async (req, res) => {
  try {
    const companyData = {};
    const symbols = Object.keys(VENDORS);
    const total = symbols.length;

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      console.log(`Processing ${symbol} (${i + 1}/${total}): ${VENDORS[symbol]}`);

      try {
        let overview = await getCachedData(symbol, 'overview');
        if (!overview) {
          console.log(`Fetching overview for ${symbol}...`);
          overview = await fetchFromAlphaVantage('OVERVIEW', symbol);

          // Check for API error response
          if (overview['Error Message'] || overview['Note']) {
            throw new Error(overview['Error Message'] || overview['Note'] || 'API rate limit exceeded');
          }

          await setCachedData(symbol, 'overview', overview);
        }

        let income = await getCachedData(symbol, 'income');
        if (!income) {
          console.log(`Fetching income statement for ${symbol}...`);
          income = await fetchFromAlphaVantage('INCOME_STATEMENT', symbol);

          // Check for API error response
          if (income['Error Message'] || income['Note']) {
            throw new Error(income['Error Message'] || income['Note'] || 'API rate limit exceeded');
          }

          await setCachedData(symbol, 'income', income);
        }

        const latestAnnual = income.annualReports?.[0];

        companyData[symbol] = {
          name: VENDORS[symbol],
          symbol,
          marketCap: overview.MarketCapitalization,
          revenue: latestAnnual?.totalRevenue,
          grossProfit: latestAnnual?.grossProfit,
          netIncome: latestAnnual?.netIncome,
          peRatio: overview.PERatio,
          profitMargin: overview.ProfitMargin,
          returnOnEquity: overview.ReturnOnEquityTTM,
          debtToEquity: overview.DebtToEquityRatio,
          fiscalYear: latestAnnual?.fiscalDateEnding,
          flags: []
        };

        // Add flags for concerning metrics
        if (parseFloat(overview.ProfitMargin) < 0.05) {
          companyData[symbol].flags.push('Low Profit Margin');
        }
        if (parseFloat(overview.DebtToEquityRatio) > 1.5) {
          companyData[symbol].flags.push('High Debt');
        }
        if (parseFloat(latestAnnual?.totalRevenue) < 1000000000) {
          companyData[symbol].flags.push('Low Revenue');
        }

        console.log(`✅ Successfully processed ${symbol}`);

      } catch (error) {
        console.error(`❌ Error fetching data for ${symbol}:`, error.message);
        companyData[symbol] = {
          name: VENDORS[symbol],
          symbol,
          error: `Failed to fetch data: ${error.message}`
        };
      }

      // Add delay to respect API rate limits
      if (i < symbols.length - 1) {
        console.log(`Waiting 1 second before next API call...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ Completed fetching all company data');
    res.json(companyData);
  } catch (error) {
    console.error('❌ Dashboard comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});