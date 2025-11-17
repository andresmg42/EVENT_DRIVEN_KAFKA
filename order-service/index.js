const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

// Connect to Kafka
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Order Service: Kafka producer connected');
  } catch (error) {
    console.error('Order Service: Failed to connect producer', error);
    setTimeout(connectProducer, 5000);
  }
};

connectProducer();

// Create order endpoint
app.post('/orders', async (req, res) => {
  try {
    const order = {
      orderId: `ORD-${Date.now()}`,
      customerId: req.body.customerId,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      timestamp: new Date().toISOString()
    };

    // Publish order created event to Kafka
    await producer.send({
      topic: 'order-events',
      messages: [{
        key: order.orderId,
        value: JSON.stringify({
          eventType: 'ORDER_CREATED',
          data: order
        })
      }]
    });

    console.log(`Order created: ${order.orderId}`);
    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders endpoint (mock)
app.get('/orders', (req, res) => {
  res.json({ message: 'Orders endpoint', service: 'order-service' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await producer.disconnect();
  process.exit(0);
});