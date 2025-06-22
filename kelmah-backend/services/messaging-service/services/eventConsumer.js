/**
 * Event Consumer Service
 * Handles subscribing to and processing events from other services
 */
const amqp = require('amqplib');

class EventConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = 'kelmah.events';
    this.queueName = 'messaging-service-queue';
    this.connected = false;
    this.reconnectInterval = 5000; // 5 seconds
    this.eventHandlers = new Map();
  }

  /**
   * Connect to the RabbitMQ server
   */
  async connect() {
    try {
      const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
      this.connection = await amqp.connect(rabbitMqUrl);
      
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        this.connected = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      });
      
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connected = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      });
      
      this.channel = await this.connection.createChannel();
      
      // Create a topic exchange for events
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      // Create a queue for this service
      const { queue } = await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 24 * 60 * 60 * 1000 // 24 hours
        }
      });
      
      this.connected = true;
      console.log('Connected to RabbitMQ for event consumption');
      
      return queue;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ for event consumption:', error);
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  /**
   * Register an event handler for a specific event type
   * @param {string} eventType - The event type to handle (routing key pattern)
   * @param {Function} handler - The handler function
   */
  registerEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
    console.log(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Start consuming events
   */
  async startConsuming() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Bind to events this service is interested in
      const bindingPatterns = [
        'user.#',         // All user events
        'job.#',          // All job events
        'payment.#',      // All payment events
        'auth.#',         // All auth events
        'contract.#',     // All contract events
        'notification.#'  // All notification events
      ];
      
      for (const pattern of bindingPatterns) {
        await this.channel.bindQueue(this.queueName, this.exchangeName, pattern);
        console.log(`Bound to events: ${pattern}`);
      }
      
      // Start consuming messages
      await this.channel.consume(
        this.queueName,
        async (message) => {
          try {
            if (!message) return;
            
            const content = JSON.parse(message.content.toString());
            const routingKey = message.fields.routingKey;
            
            console.log(`Received event: ${routingKey}`);
            
            // Find a handler for this event type
            const handler = this.findHandler(routingKey);
            
            if (handler) {
              await handler(content.data, content.metadata);
              // Acknowledge the message
              this.channel.ack(message);
            } else {
              console.warn(`No handler found for event type: ${routingKey}`);
              // Acknowledge the message even if we don't have a handler
              this.channel.ack(message);
            }
          } catch (error) {
            console.error('Error processing event:', error);
            // Reject the message and requeue
            this.channel.nack(message, false, true);
          }
        },
        { noAck: false }
      );
      
      console.log('Started consuming events');
    } catch (error) {
      console.error('Failed to start consuming events:', error);
      setTimeout(() => this.startConsuming(), this.reconnectInterval);
    }
  }
  
  /**
   * Find a handler for the given routing key
   * @param {string} routingKey - The routing key to match
   * @returns {Function|null} The handler function or null if not found
   */
  findHandler(routingKey) {
    // First try exact match
    if (this.eventHandlers.has(routingKey)) {
      return this.eventHandlers.get(routingKey);
    }
    
    // Try pattern matching
    for (const [pattern, handler] of this.eventHandlers.entries()) {
      if (this.matchPattern(pattern, routingKey)) {
        return handler;
      }
    }
    
    return null;
  }
  
  /**
   * Match a routing key against a pattern
   * @param {string} pattern - The pattern with wildcards
   * @param {string} routingKey - The routing key to match
   * @returns {boolean} True if the pattern matches
   */
  matchPattern(pattern, routingKey) {
    // Convert the pattern to a regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.*');
      
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(routingKey);
  }
  
  /**
   * Close the connection
   */
  async close() {
    try {
      await this.channel.close();
      await this.connection.close();
      this.connected = false;
      console.log('Closed RabbitMQ connection for event consumption');
    } catch (error) {
      console.error('Error closing RabbitMQ connection for event consumption:', error);
    }
  }
}

// Create singleton instance
const consumer = new EventConsumer();

module.exports = consumer; 