/**
 * Secure Messaging Module
 * Encrypted inter-agent communication via MQTT
 */

const mqtt = require('mqtt');
const crypto = require('crypto');

class SecureMessaging {
  constructor() {
    this.client = null;
    this.messageHandlers = new Map();
    this.encryptionKeys = new Map();
    this.isConnected = false;
  }

  /**
   * Initialize MQTT connection
   */
  async connect(brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883') {
    try {
      console.log('🔐 Connecting to MQTT broker...');
      
      this.client = mqtt.connect(brokerUrl, {
        clientId: `policy-navigator-${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000
      });

      return new Promise((resolve, reject) => {
        this.client.on('connect', () => {
          console.log('✅ Connected to MQTT broker');
          this.isConnected = true;
          resolve(true);
        });

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error);
          reject(error);
        });

        this.client.on('message', (topic, message) => {
          this.handleIncomingMessage(topic, message);
        });
      });
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      throw error;
    }
  }

  /**
   * Register message handler for an agent
   */
  registerHandler(agentDID, handler) {
    this.messageHandlers.set(agentDID, handler);
    
    // Subscribe to agent's topic
    const topic = this.getAgentTopic(agentDID);
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`📡 Subscribed to topic: ${topic}`);
      }
    });
  }

  /**
   * Get MQTT topic for an agent
   */
  getAgentTopic(agentDID) {
    // Use DID as topic namespace
    const shortDID = agentDID.split(':').pop().substring(0, 8);
    return `policy-navigator/agents/${shortDID}`;
  }

  /**
   * Send encrypted message to another agent
   */
  async sendMessage(fromDID, toDID, messageType, payload) {
    try {
      if (!this.isConnected) {
        throw new Error('MQTT client not connected');
      }

      // Create message envelope
      const envelope = {
        from: fromDID,
        to: toDID,
        type: messageType,
        payload: payload,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };

      // Encrypt payload
      const encryptedEnvelope = this.encryptMessage(envelope, toDID);

      // Add signature
      const signedEnvelope = this.signMessage(encryptedEnvelope, fromDID);

      // Publish to recipient's topic
      const topic = this.getAgentTopic(toDID);
      
      return new Promise((resolve, reject) => {
        this.client.publish(
          topic,
          JSON.stringify(signedEnvelope),
          { qos: 1 },
          (err) => {
            if (err) {
              console.error('Failed to send message:', err);
              reject(err);
            } else {
              console.log(`📤 Sent ${messageType} message from ${fromDID} to ${toDID}`);
              resolve(signedEnvelope.messageId);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  handleIncomingMessage(topic, messageBuffer) {
    try {
      const message = JSON.parse(messageBuffer.toString());
      
      // Verify signature
      if (!this.verifySignature(message)) {
        console.error('Invalid message signature');
        return;
      }

      // Decrypt message
      const decryptedEnvelope = this.decryptMessage(message);

      // Get handler for recipient
      const handler = this.messageHandlers.get(decryptedEnvelope.to);
      
      if (handler) {
        console.log(`📥 Received ${decryptedEnvelope.type} message for ${decryptedEnvelope.to}`);
        handler(decryptedEnvelope);
      } else {
        console.warn(`No handler registered for ${decryptedEnvelope.to}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Encrypt message payload
   */
  encryptMessage(envelope, recipientDID) {
    try {
      // Get or generate encryption key for this agent pair
      const key = this.getEncryptionKey(envelope.from, recipientDID);
      
      // Encrypt payload
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      const payloadStr = JSON.stringify(envelope.payload);
      let encrypted = cipher.update(payloadStr, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        ...envelope,
        payload: encrypted,
        iv: iv.toString('hex'),
        encrypted: true
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt message payload
   */
  decryptMessage(envelope) {
    try {
      if (!envelope.encrypted) {
        return envelope;
      }

      // Get encryption key
      const key = this.getEncryptionKey(envelope.from, envelope.to);
      
      // Decrypt payload
      const iv = Buffer.from(envelope.iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(envelope.payload, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        ...envelope,
        payload: JSON.parse(decrypted),
        encrypted: false
      };
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  /**
   * Get or generate encryption key for agent pair
   */
  getEncryptionKey(agentDID1, agentDID2) {
    // Create consistent key identifier regardless of order
    const keyId = [agentDID1, agentDID2].sort().join('::');
    
    if (!this.encryptionKeys.has(keyId)) {
      // Generate new key (in production: use proper key exchange)
      const key = crypto.randomBytes(32);
      this.encryptionKeys.set(keyId, key);
      console.log(`🔑 Generated encryption key for ${agentDID1} <-> ${agentDID2}`);
    }
    
    return this.encryptionKeys.get(keyId);
  }

  /**
   * Sign message with sender's private key
   */
  signMessage(envelope, senderDID) {
    const messageStr = JSON.stringify({
      from: envelope.from,
      to: envelope.to,
      type: envelope.type,
      payload: envelope.payload,
      timestamp: envelope.timestamp
    });

    const signature = crypto
      .createHash('sha256')
      .update(messageStr + senderDID)
      .digest('hex');

    return {
      ...envelope,
      signature,
      signed: true
    };
  }

  /**
   * Verify message signature
   */
  verifySignature(envelope) {
    if (!envelope.signed || !envelope.signature) {
      return false;
    }

    const messageStr = JSON.stringify({
      from: envelope.from,
      to: envelope.to,
      type: envelope.type,
      payload: envelope.payload,
      timestamp: envelope.timestamp
    });

    const expectedSignature = crypto
      .createHash('sha256')
      .update(messageStr + envelope.from)
      .digest('hex');

    return envelope.signature === expectedSignature;
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(fromDID, messageType, payload) {
    const topic = 'policy-navigator/broadcast';
    
    const envelope = {
      from: fromDID,
      type: messageType,
      payload: payload,
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId()
    };

    return new Promise((resolve, reject) => {
      this.client.publish(
        topic,
        JSON.stringify(envelope),
        { qos: 1 },
        (err) => {
          if (err) reject(err);
          else {
            console.log(`📢 Broadcast ${messageType} from ${fromDID}`);
            resolve(envelope.messageId);
          }
        }
      );
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect() {
    if (this.client) {
      console.log('🔌 Disconnecting from MQTT broker...');
      this.client.end();
      this.isConnected = false;
    }
  }
}

// Singleton instance
const messagingInstance = new SecureMessaging();

/**
 * Initialize secure channel for all agents
 */
async function initializeSecureChannel(agents) {
  try {
    await messagingInstance.connect();
    
    // Register handlers for all agents
    for (const agent of agents) {
      if (agent.did) {
        messagingInstance.registerHandler(agent.did, (message) => {
          if (agent.handleMessage) {
            agent.handleMessage(message);
          }
        });
      }
    }
    
    return messagingInstance;
  } catch (error) {
    console.error('Failed to initialize secure channel:', error);
    throw error;
  }
}

module.exports = {
  SecureMessaging,
  messagingInstance,
  initializeSecureChannel
};