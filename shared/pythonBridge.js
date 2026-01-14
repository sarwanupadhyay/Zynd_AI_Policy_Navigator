/**
 * Python Bridge
 * Connects Node.js server with Python Zynd agents
 */

const { spawn } = require('child_process');
const axios = require('axios');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

class PythonBridge {
  constructor() {
    this.pythonProcess = null;
    this.isInitialized = false;
  }

  /**
   * Start Python agent service
   */
  async startPythonService() {
    return new Promise((resolve, reject) => {
      console.log('🐍 Starting Python agent service...');
      
      // Start Python Flask server
      this.pythonProcess = spawn('python', ['agents/python/agent_wrapper.py']);

      this.pythonProcess.stdout.on('data', (data) => {
        console.log(`Python: ${data.toString().trim()}`);
        
        if (data.toString().includes('Starting Python Agent Service')) {
          setTimeout(() => resolve(true), 2000); // Wait for Flask to start
        }
      });

      this.pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data.toString().trim()}`);
      });

      this.pythonProcess.on('error', (error) => {
        console.error('Failed to start Python service:', error);
        reject(error);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python service exited with code ${code}`);
        this.isInitialized = false;
      });

      // Timeout if service doesn't start
      setTimeout(() => {
        if (!this.isInitialized) {
          reject(new Error('Python service failed to start within timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Initialize Python agents
   */
  async initializeAgents() {
    try {
      console.log('🔄 Initializing Python agents with real Zynd package...');
      
      const response = await axios.post(`${PYTHON_SERVICE_URL}/api/python/init`);
      
      if (response.data.status === 'initialized') {
        this.isInitialized = true;
        console.log('✅ Python agents initialized successfully');
        return true;
      }
      
      throw new Error('Failed to initialize Python agents');
    } catch (error) {
      console.error('Python agent initialization error:', error.message);
      throw error;
    }
  }

  /**
   * Process query through Python agents
   */
  async processQuery(query) {
    try {
      if (!this.isInitialized) {
        throw new Error('Python agents not initialized');
      }

      console.log('🔄 Sending query to Python agents...');
      
      const response = await axios.post(`${PYTHON_SERVICE_URL}/api/python/query`, {
        query
      });

      return response.data;
    } catch (error) {
      console.error('Python query processing error:', error.message);
      throw error;
    }
  }

  /**
   * Check if Python service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/health`);
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Stop Python service
   */
  async stop() {
    if (this.pythonProcess) {
      console.log('🛑 Stopping Python agent service...');
      this.pythonProcess.kill();
      this.isInitialized = false;
    }
  }
}

// Singleton instance
const pythonBridge = new PythonBridge();

module.exports = pythonBridge;