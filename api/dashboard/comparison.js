import axios from 'axios';

// Simple in-memory cache for serverless functions
let dataCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

export default async function handler(req, res) {
  try {
    console.log('Dashboard comparison API called');

    // Only process the 5 expected vendors
    const expectedSymbols = ['TEL', 'ST', 'DD', 'CE', 'LYB'];
    const companyData = {};

    console.log('Processing only these vendors:', expectedSymbols);

    // Validate that VENDORS contains our expected companies
    for (const symbol of expectedSymbols) {
      if (!VENDORS[symbol]) {
        console.error(`Missing vendor: ${symbol}`);
        return res.status(500).json({ error: `Missing vendor definition for ${symbol}` });
      }
    }

    for (let i = 0; i < expectedSymbols.length; i++) {
      const symbol = expectedSymbols[i];
      console.log(`Processing ${symbol} (${i + 1}/${expectedSymbols.length}): ${VENDORS[symbol]}`);

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

        // Ensure we have the company name
        const companyName = VENDORS[symbol];
        if (!companyName) {
          throw new Error(`No company name found for symbol ${symbol}`);
        }

        companyData[symbol] = {
          name: companyName,
          symbol: symbol,
          marketCap: overview.MarketCapitalization || 'N/A',
          revenue: latestAnnual?.totalRevenue || 'N/A',
          grossProfit: latestAnnual?.grossProfit || 'N/A',
          netIncome: latestAnnual?.netIncome || 'N/A',
          peRatio: overview.PERatio || 'N/A',
          profitMargin: overview.ProfitMargin || 'N/A',
          returnOnEquity: overview.ReturnOnEquityTTM || 'N/A',
          debtToEquity: overview.DebtToEquityRatio || 'N/A',
          fiscalYear: latestAnnual?.fiscalDateEnding || 'N/A',
          flags: []
        };

        // Add flags for concerning metrics (only if data is available)
        if (overview.ProfitMargin && parseFloat(overview.ProfitMargin) < 0.05) {
          companyData[symbol].flags.push('Low Profit Margin');
        }
        if (overview.DebtToEquityRatio && parseFloat(overview.DebtToEquityRatio) > 1.5) {
          companyData[symbol].flags.push('High Debt');
        }
        if (latestAnnual?.totalRevenue && parseFloat(latestAnnual.totalRevenue) < 1000000000) {
          companyData[symbol].flags.push('Low Revenue');
        }

        console.log(`✅ Successfully processed ${symbol}: ${companyName}`);

      } catch (error) {
        console.error(`❌ Error fetching data for ${symbol}:`, error.message);
        companyData[symbol] = {
          name: VENDORS[symbol] || symbol,
          symbol: symbol,
          error: `Failed to fetch data: ${error.message}`,
          flags: ['Data Error']
        };
      }

      // Add delay to respect API rate limits
      if (i < expectedSymbols.length - 1) {
        console.log(`Waiting 1 second before next API call...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Validate the response before sending
    const resultKeys = Object.keys(companyData);
    console.log(`✅ Completed fetching data for ${resultKeys.length} companies:`, resultKeys);

    if (resultKeys.length !== 5) {
      console.error(`Expected 5 companies, got ${resultKeys.length}`);
    }

    // Ensure we only return the expected companies
    const filteredData = {};
    for (const symbol of expectedSymbols) {
      if (companyData[symbol]) {
        filteredData[symbol] = companyData[symbol];
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(filteredData);
  } catch (error) {
    console.error('❌ Dashboard comparison error:', error);
    res.status(500).json({ error: error.message });
  }
}