import axios from 'axios';

export default async function handler(req, res) {
  try {
    console.log('=== API KEY TEST ENDPOINT ===');

    // Check environment
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);

    if (!apiKey) {
      return res.status(500).json({
        error: 'No API key found',
        env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
      });
    }

    // Test with one simple API call
    console.log('Testing API call to Alpha Vantage...');
    const testUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=TEL&apikey=${apiKey}`;

    const response = await axios.get(testUrl, { timeout: 10000 });
    console.log('API Response received');
    console.log('Response keys:', Object.keys(response.data).slice(0, 10));

    if (response.data['Error Message']) {
      return res.status(400).json({
        error: 'API Error',
        message: response.data['Error Message'],
        apiKey: apiKey.substring(0, 8) + '...'
      });
    }

    if (response.data['Note']) {
      return res.status(429).json({
        error: 'Rate Limited',
        message: response.data['Note'],
        apiKey: apiKey.substring(0, 8) + '...'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API key working correctly',
      companyName: response.data.Name || 'Unknown',
      symbol: response.data.Symbol || 'TEL',
      apiKey: apiKey.substring(0, 8) + '...',
      responseKeys: Object.keys(response.data).slice(0, 10)
    });

  } catch (error) {
    console.error('Test API error:', error.message);
    return res.status(500).json({
      error: 'Network or server error',
      message: error.message,
      details: error.response?.data || 'No response data'
    });
  }
}