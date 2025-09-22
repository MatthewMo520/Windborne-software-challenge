const axios = require('axios');

// Simple in-memory cache for serverless functions
let dataCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// EXACTLY these 5 companies - no more, no less
const VENDORS = {
  'TEL': 'TE Connectivity',
  'ST': 'Sensata Technologies',
  'DD': 'DuPont de Nemours',
  'CE': 'Celanese',
  'LYB': 'LyondellBasell'
};

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

module.exports = async function handler(req, res) {
  try {
    console.log('=== DASHBOARD COMPARISON API CALLED ===');
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- VERCEL:', process.env.VERCEL);

    // Check API key availability
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    console.log('- API Key exists:', !!apiKey);
    console.log('- API Key length:', apiKey ? apiKey.length : 0);
    console.log('- API Key first 8 chars:', apiKey ? apiKey.substring(0, 8) + '...' : 'N/A');

    if (!apiKey) {
      console.error('❌ CRITICAL: No API key found in environment');
      return res.status(500).json({
        error: 'Alpha Vantage API key not configured',
        details: 'ALPHA_VANTAGE_API_KEY environment variable missing',
        debug: {
          env: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL,
          availableEnvVars: Object.keys(process.env).filter(key => key.includes('ALPHA')).length
        }
      });
    }

    // Create result object that can ONLY contain our 5 companies
    const result = {};

    // Process each of our 5 companies
    const companySymbols = ['TEL', 'ST', 'DD', 'CE', 'LYB'];

    console.log('Processing exactly 5 companies:', companySymbols);

    for (let i = 0; i < companySymbols.length; i++) {
      const symbol = companySymbols[i];
      const companyName = VENDORS[symbol];

      console.log(`Processing ${i + 1}/5: ${symbol} - ${companyName}`);

      try {
        // Try to get cached data first
        let overview = getCachedData(symbol, 'overview');
        let income = getCachedData(symbol, 'income');

        // If no cache, fetch from API
        if (!overview) {
          console.log(`Fetching overview for ${symbol}...`);
          overview = await fetchFromAlphaVantage('OVERVIEW', symbol);
          console.log(`Overview response for ${symbol}:`, {
            hasData: !!overview,
            hasError: !!(overview?.['Error Message'] || overview?.['Note']),
            errorMsg: overview?.['Error Message'] || overview?.['Note'],
            keys: overview ? Object.keys(overview).slice(0, 5) : []
          });

          if (overview && !overview['Error Message'] && !overview['Note']) {
            setCachedData(symbol, 'overview', overview);
          } else if (overview?.['Error Message'] || overview?.['Note']) {
            throw new Error(`API Error: ${overview['Error Message'] || overview['Note']}`);
          }
        }

        if (!income) {
          console.log(`Fetching income statement for ${symbol}...`);
          income = await fetchFromAlphaVantage('INCOME_STATEMENT', symbol);
          console.log(`Income response for ${symbol}:`, {
            hasData: !!income,
            hasError: !!(income?.['Error Message'] || income?.['Note']),
            errorMsg: income?.['Error Message'] || income?.['Note'],
            hasReports: !!(income?.annualReports?.length)
          });

          if (income && !income['Error Message'] && !income['Note']) {
            setCachedData(symbol, 'income', income);
          } else if (income?.['Error Message'] || income?.['Note']) {
            throw new Error(`API Error: ${income['Error Message'] || income['Note']}`);
          }
        }

        // Extract data safely
        const latestAnnual = income?.annualReports?.[0] || {};

        // Create company entry with validation
        result[symbol] = {
          name: companyName,
          symbol: symbol,
          marketCap: overview?.MarketCapitalization || 'N/A',
          revenue: latestAnnual?.totalRevenue || 'N/A',
          grossProfit: latestAnnual?.grossProfit || 'N/A',
          netIncome: latestAnnual?.netIncome || 'N/A',
          peRatio: overview?.PERatio || 'N/A',
          profitMargin: overview?.ProfitMargin || 'N/A',
          returnOnEquity: overview?.ReturnOnEquityTTM || 'N/A',
          debtToEquity: overview?.DebtToEquityRatio || 'N/A',
          fiscalYear: latestAnnual?.fiscalDateEnding || 'N/A',
          flags: []
        };

        // Add flags only if we have valid data
        try {
          if (overview?.ProfitMargin && parseFloat(overview.ProfitMargin) < 0.05) {
            result[symbol].flags.push('Low Profit Margin');
          }
          if (overview?.DebtToEquityRatio && parseFloat(overview.DebtToEquityRatio) > 1.5) {
            result[symbol].flags.push('High Debt');
          }
          if (latestAnnual?.totalRevenue && parseFloat(latestAnnual.totalRevenue) < 1000000000) {
            result[symbol].flags.push('Low Revenue');
          }
        } catch (flagError) {
          console.log(`Flag calculation error for ${symbol}:`, flagError.message);
        }

        console.log(`✅ Successfully processed ${symbol}: ${companyName}`);

      } catch (error) {
        console.error(`❌ Error processing ${symbol}:`, error.message);

        // Even on error, create a basic entry so we still have 5 companies
        result[symbol] = {
          name: companyName,
          symbol: symbol,
          marketCap: 'N/A',
          revenue: 'N/A',
          grossProfit: 'N/A',
          netIncome: 'N/A',
          peRatio: 'N/A',
          profitMargin: 'N/A',
          returnOnEquity: 'N/A',
          debtToEquity: 'N/A',
          fiscalYear: 'N/A',
          flags: ['Data Error'],
          error: error.message
        };
      }

      // Longer delay between API calls to respect rate limits
      // Alpha Vantage free tier: 5 calls per minute
      if (i < companySymbols.length - 1) {
        console.log(`Waiting 15 seconds before next company (rate limiting)...`);
        await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
      }
    }

    // Final validation
    const resultKeys = Object.keys(result);
    console.log(`=== FINAL RESULT: ${resultKeys.length} companies ===`);
    console.log('Companies in result:', resultKeys);

    if (resultKeys.length !== 5) {
      console.error(`ERROR: Expected exactly 5 companies, got ${resultKeys.length}`);
      return res.status(500).json({
        error: `Internal error: Expected 5 companies, got ${resultKeys.length}`,
        received: resultKeys.length,
        expected: 5
      });
    }

    // Ensure response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    console.log('=== SENDING RESPONSE WITH 5 COMPANIES ===');
    return res.status(200).json(result);

  } catch (error) {
    console.error('=== CRITICAL API ERROR ===', error);
    return res.status(500).json({
      error: 'Failed to fetch company data',
      details: error.message
    });
  }
}