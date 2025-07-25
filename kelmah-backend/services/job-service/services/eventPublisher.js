/**
 * Event Publisher Service
 * Handles publishing events for inter-service communication
 */
const amqp = require("amqplib");

class EventPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = "kelmah.events";
    this.connected = false;
    this.reconnectInterval = 5000; // 5 seconds
  }

  /**
   * Connect to the RabbitMQ server
   */
  async connect() {
    try {
      const rabbitMqUrl = process.env.RABBITMQ_URL || "amqp://localhost";
      this.connection = await amqp.connect(rabbitMqUrl);

      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
        this.connected = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
        this.connected = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      });

      this.channel = await this.connection.createChannel();

      // Create a topic exchange for events
      await this.channel.assertExchange(this.exchangeName, "topic", {
        durable: true,
      });

      this.connected = true;
      console.log("Connected to RabbitMQ");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  /**
   * Publish an event to the exchange
   * @param {string} routingKey - The routing key for the event (e.g., 'job.created')
   * @param {Object} data - The event payload
   * @param {Object} options - Publishing options
   */
  async publishEvent(routingKey, data, options = {}) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const eventData = {
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          service: "job-service",
          eventType: routingKey,
        },
      };

      const buffer = Buffer.from(JSON.stringify(eventData));

      const publishOptions = {
        persistent: true,
        ...options,
      };

      const result = this.channel.publish(
        this.exchangeName,
        routingKey,
        buffer,
        publishOptions,
      );

      if (result) {
        console.log(`Event published: ${routingKey}`);
      } else {
        console.warn(
          `Failed to publish event: ${routingKey}. Channel buffer full.`,
        );
      }

      return result;
    } catch (error) {
      console.error(`Error publishing event ${routingKey}:`, error);
      throw error;
    }
  }

  /**
   * Close the connection
   */
  async close() {
    try {
      await this.channel.close();
      await this.connection.close();
      this.connected = false;
      console.log("Closed RabbitMQ connection");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

// Create singleton instance
const publisher = new EventPublisher();

module.exports = publisher;
