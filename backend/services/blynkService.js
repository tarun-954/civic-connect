/**
 * Blynk IoT Service
 * Fetches data from Blynk cloud for smart dustbin monitoring
 */

const https = require('https');

class BlynkService {
  constructor() {
    // Blynk API configuration
    this.blynkServer = 'blynk.cloud';
    this.templateId = 'TMPL3ha6B5e7d';
    this.authToken = 'vvxZw6IiQg1ErbDNfDlhYyfq-Ed5Mlm7';
  }

  /**
   * Fetch data from a specific Blynk virtual pin
   * @param {string} deviceId - Blynk device ID (if using device-specific tokens)
   * @param {number} pin - Virtual pin number (V0, V1, etc.)
   * @returns {Promise<Object>} Pin data
   */
  async getPinValue(pin = 'V0', deviceId = null) {
    return new Promise((resolve, reject) => {
      const token = deviceId ? deviceId : this.authToken;
      const url = `https://${this.blynkServer}/external/api/get?token=${token}&${pin}`;

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // Blynk returns plain text for single pin values
            // Try to parse as number first, then JSON, then return as string
            const numValue = parseFloat(data);
            if (!isNaN(numValue)) {
              resolve({ value: numValue, raw: data });
            } else {
              try {
                const jsonValue = JSON.parse(data);
                resolve({ value: jsonValue, raw: data });
              } catch {
                resolve({ value: data.trim(), raw: data });
              }
            }
          } catch (error) {
            reject(new Error(`Failed to parse Blynk response: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Blynk API request failed: ${error.message}`));
      });
    });
  }

  /**
   * Get all pin values for a device
   * @param {string} deviceId - Blynk device ID (optional)
   * @returns {Promise<Object>} All pin values
   */
  async getAllPinValues(deviceId = null) {
    try {
      // Common pins for smart dustbin:
      // V0: Fill percentage (0-100)
      // V1: Distance in cm
      // V2: Status (0=empty, 1=warning, 2=full)
      // V3: Last update timestamp
      // V4: Location label
      
      const pins = ['V0', 'V1', 'V2', 'V3', 'V4'];
      const results = {};

      for (const pin of pins) {
        try {
          const pinData = await this.getPinValue(pin, deviceId);
          results[pin] = pinData.value;
        } catch (error) {
          console.warn(`Failed to fetch ${pin}:`, error.message);
          results[pin] = null;
        }
      }

      return {
        fillPercentage: results.V0 || 0,
        distance: results.V1 || 0,
        status: results.V2 || 0,
        lastUpdate: results.V3 || Date.now(),
        location: results.V4 || 'Unknown Location',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch Blynk data: ${error.message}`);
    }
  }

  /**
   * Get dustbin status with formatted data
   * @param {string} deviceId - Optional device ID
   * @returns {Promise<Object>} Formatted dustbin status
   */
  async getDustbinStatus(deviceId = null) {
    try {
      const data = await this.getAllPinValues(deviceId);
      
      // Determine status level
      let statusLevel = 'empty';
      let statusMessage = 'Dustbin is empty';
      let needsAttention = false;

      if (data.fillPercentage >= 100) {
        statusLevel = 'full';
        statusMessage = 'Dustbin is FULL - needs immediate attention!';
        needsAttention = true;
      } else if (data.fillPercentage >= 90) {
        statusLevel = 'warning';
        statusMessage = 'Dustbin is almost full - schedule cleaning soon';
        needsAttention = true;
      } else if (data.fillPercentage >= 50) {
        statusLevel = 'medium';
        statusMessage = 'Dustbin is half full';
      } else {
        statusLevel = 'empty';
        statusMessage = 'Dustbin is empty or nearly empty';
      }

      return {
        ...data,
        statusLevel,
        statusMessage,
        needsAttention,
        isFull: data.fillPercentage >= 100,
        isWarning: data.fillPercentage >= 90 && data.fillPercentage < 100
      };
    } catch (error) {
      throw new Error(`Failed to get dustbin status: ${error.message}`);
    }
  }

  /**
   * Get multiple dustbin statuses (for multiple devices)
   * @param {Array<string>} deviceIds - Array of device IDs or tokens
   * @returns {Promise<Array>} Array of dustbin statuses
   */
  async getMultipleDustbins(deviceIds = []) {
    try {
      if (deviceIds.length === 0) {
        // If no device IDs provided, fetch from default token
        const status = await this.getDustbinStatus();
        return [status];
      }

      const promises = deviceIds.map((deviceId, index) => 
        this.getDustbinStatus(deviceId).catch(error => ({
          error: error.message,
          deviceId: deviceId || `device-${index}`,
          fillPercentage: 0,
          statusLevel: 'error'
        }))
      );

      return Promise.all(promises);
    } catch (error) {
      throw new Error(`Failed to fetch multiple dustbins: ${error.message}`);
    }
  }
}

module.exports = new BlynkService();

