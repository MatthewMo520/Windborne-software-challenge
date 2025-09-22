const axios = require('axios');

// Simple in-memory cache for serverless functions
let dataCache = new Map();
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

module.exports = async function handler(req, res) {
  const { symbol } = req.query;

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
}