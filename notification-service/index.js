const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

// Store notifications (in-memory for demo)
const notifications = [];

const connectKafka = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: false });
    await consumer.subscribe({ topic: 'inventory-events', fromBeginning: false });
    
    console.log('Notification Service: Kafka connected');

    // Consume events from multiple topics
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        let notification = {};

        if (topic === 'order-events' && event.eventType === 'ORDER_CREATED') {
          notification = {
            id: `NOTIF-${Date.now()}`,
            type: 'ORDER_CONFIRMATION',
            message: `Order ${event.data.orderId} has been created successfully`,
            customerId: event.data.customerId,
            timestamp: new Date().toISOString()
          };
          
          console.log(`📧 Sending notification: ${notification.message}`);
        } 
        else if (topic === 'inventory-events') {
          if (event.eventType === 'INVENTORY_RESERVED') {
            notification = {
              id: `NOTIF-${Date.now()}`,
              type: 'INVENTORY_SUCCESS',
              message: `Inventory reserved for order ${event.data.orderId}`,
              orderId: event.data.orderId,
              timestamp: new Date().toISOString()
            };
            
            console.log(`📦 Sending notification: ${notification.message}`);
          } 
          else if (event.eventType === 'INVENTORY_INSUFFICIENT') {
            notification = {
              id: `NOTIF-${Date.now()}`,
              type: 'INVENTORY_FAILURE',
              message: `Insufficient inventory for order ${event.data.orderId}`,
              orderId: event.data.orderId,
              timestamp: new Date().toISOString()
            };
            
            console.log(`⚠️  Sending notification: ${notification.message}`);
          }
        }

        if (notification.id) {
          notifications.push(notification);
        }
      }
    });
  } catch (error) {
    console.error('Notification Service: Kafka connection failed', error);
    setTimeout(connectKafka, 5000);
  }
};

connectKafka();

// Get notifications endpoint
app.get('/notifications', (req, res) => {
  res.json({ notifications: notifications.slice(-20) });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await consumer.disconnect();
  process.exit(0);
});