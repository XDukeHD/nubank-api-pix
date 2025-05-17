const config = require('../../config/config.json');
const { ApiClient } = require('../models');


const authenticate = async (req, res, next) => {
  try {
    const apiKey = req.header('api-key');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }

    if (apiKey === config.apiKey) {
      return next();
    }

    const client = await ApiClient.findOne({
      where: {
        api_key: apiKey,
        active: true
      }
    });

    if (!client) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    req.client = client;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = {
  authenticate
};
