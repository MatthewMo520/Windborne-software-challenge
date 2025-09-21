const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(cors());
app.use(express.json());

// For Vercel, we need to handle database differently
// Using in-memory storage for now since Vercel is serverless
let dataCache = new Map();

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
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ API call successful: ${endpoint} for ${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint} for ${symbol}:`, error.message);
    throw error;
  }
}

function getCachedData(symbol, dataType) {
  const key = `${symbol}_${dataType}`;
  const cached = dataCache.get(key);

  if (cached) {
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge < CACHE_DURATION) {
      return cached.data;
    }
  }
  return null;
}

function setCachedData(symbol, dataType, data) {
  const key = `${symbol}_${dataType}`;
  dataCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
}

// API Routes
app.get('/api/vendors', (req, res) => {
  res.json(VENDORS);
});

app.get('/api/company/:symbol/overview', async (req, res) => {
  const { symbol } = req.params;

  try {
    let data = getCachedData(symbol, 'overview');

    if (!data) {
      data = await fetchFromAlphaVantage('OVERVIEW', symbol);
      setCachedData(symbol, 'overview', data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/company/:symbol/income', async (req, res) => {
  const { symbol } = req.params;

  try {
    let data = getCachedData(symbol, 'income');

    if (!data) {
      data = await fetchFromAlphaVantage('INCOME_STATEMENT', symbol);
      setCachedData(symbol, 'income', data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/company/:symbol/balance', async (req, res) => {
  const { symbol } = req.params;

  try {
    let data = getCachedData(symbol, 'balance');

    if (!data) {
      data = await fetchFromAlphaVantage('BALANCE_SHEET', symbol);
      setCachedData(symbol, 'balance', data);
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
        let overview = getCachedData(symbol, 'overview');
        if (!overview) {
          console.log(`Fetching overview for ${symbol}...`);
          overview = await fetchFromAlphaVantage('OVERVIEW', symbol);

          if (overview['Error Message'] || overview['Note']) {
            throw new Error(overview['Error Message'] || overview['Note'] || 'API rate limit exceeded');
          }

          setCachedData(symbol, 'overview', overview);
        }

        let income = getCachedData(symbol, 'income');
        if (!income) {
          console.log(`Fetching income statement for ${symbol}...`);
          income = await fetchFromAlphaVantage('INCOME_STATEMENT', symbol);

          if (income['Error Message'] || income['Note']) {
            throw new Error(income['Error Message'] || income['Note'] || 'API rate limit exceeded');
          }

          setCachedData(symbol, 'income', income);
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

module.exports = app;