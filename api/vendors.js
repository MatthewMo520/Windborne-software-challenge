const VENDORS = {
  'TEL': 'TE Connectivity',
  'ST': 'Sensata Technologies',
  'DD': 'DuPont de Nemours',
  'CE': 'Celanese',
  'LYB': 'LyondellBasell'
};

module.exports = function handler(req, res) {
  try {
    console.log('Vendors API called');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(VENDORS);
  } catch (error) {
    console.error('Error in vendors API:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
}