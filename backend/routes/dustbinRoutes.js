/**
 * Smart Dustbin Routes
 * Handles IoT dustbin data from Blynk
 */

const express = require('express');
const router = express.Router();
const blynkService = require('../services/blynkService');

/**
 * GET /api/dustbins/status
 * Get current status of all dustbins
 */
router.get('/status', async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const status = await blynkService.getDustbinStatus(deviceId || null);
    
    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('Error fetching dustbin status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch dustbin status'
    });
  }
});

/**
 * GET /api/dustbins/all
 * Get status of multiple dustbins
 */
router.get('/all', async (req, res) => {
  try {
    const { deviceIds } = req.query;
    
    // Parse deviceIds if provided as comma-separated string
    const ids = deviceIds ? deviceIds.split(',').map(id => id.trim()) : [];
    
    const dustbins = await blynkService.getMultipleDustbins(ids);
    
    res.status(200).json({
      status: 'success',
      data: {
        dustbins,
        count: dustbins.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching dustbins:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch dustbins'
    });
  }
});

/**
 * GET /api/dustbins/pin/:pin
 * Get value from a specific Blynk pin
 */
router.get('/pin/:pin', async (req, res) => {
  try {
    const { pin } = req.params;
    const { deviceId } = req.query;
    
    if (!pin || !pin.startsWith('V')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid pin format. Use V0, V1, V2, etc.'
      });
    }
    
    const pinData = await blynkService.getPinValue(pin, deviceId || null);
    
    res.status(200).json({
      status: 'success',
      data: {
        pin,
        ...pinData
      }
    });
  } catch (error) {
    console.error('Error fetching pin value:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch pin value'
    });
  }
});

module.exports = router;

