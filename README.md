# Event-Driven Microservices with Kafka

## Architecture Overview

This example demonstrates three microservices communicating via Kafka events:

1. **Order Service** - Creates orders and publishes `ORDER_CREATED` events
2. **Inventory Service** - Consumes order events, checks/updates inventory, publishes `INVENTORY_RESERVED` or `INVENTORY_INSUFFICIENT` events
3. **Notification Service** - Consumes events from both services and sends notifications

## Event Flow

```
User → Order Service → [order-events topic] → Inventory Service
                                                      ↓
                                            [inventory-events topic]
                                                      ↓
                                            Notification Service
```

## Project Structure

```
project-root/
├── docker-compose.yml
├── order-service/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
├── inventory-service/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
└── notification-service/
    ├── Dockerfile
    ├── package.json
    └── index.js
```

## Setup Instructions

### 1. Create the directory structure:

```bash
mkdir -p order-service inventory-service notification-service
```

### 2. Copy files to their respective directories:

- Place the `docker-compose.yml` in the root directory
- Copy the Dockerfile to each service directory
- Copy the package.json to each service directory
- Copy each service's `index.js` to its directory

### 3. Start the services:

```bash
docker-compose up --build
```

Wait for all services to start (about 30 seconds). You'll see messages like:
- `Order Service running on port 3001`
- `Inventory Service: Kafka connected`
- `Notification Service: Kafka connected`

## Testing the System

### 1. Create an order:

```bash
curl -X POST http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-123",
    "items": [
      {"itemId": "ITEM-001", "quantity": 2},
      {"itemId": "ITEM-002", "quantity": 5}
    ],
    "totalAmount": 2500
  }'
```

### 2. Check inventory:

```bash
curl http://localhost:3002/inventory
```

### 3. View notifications:

```bash
curl http://localhost:3003/notifications
```

### 4. Test insufficient inventory:

```bash
curl -X POST http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-456",
    "items": [
      {"itemId": "ITEM-001", "quantity": 100}
    ],
    "totalAmount": 5000
  }'
```

### 5. Health checks:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## Viewing Logs

To see the event flow in action:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order-service
docker-compose logs -f inventory-service
docker-compose logs -f notification-service
```

## Key Concepts Demonstrated

### Event-Driven Communication
- Services communicate asynchronously via Kafka topics
- No direct HTTP calls between services
- Loose coupling between components

### Event Types
- `ORDER_CREATED` - Published by Order Service
- `INVENTORY_RESERVED` - Published by Inventory Service on success
- `INVENTORY_INSUFFICIENT` - Published by Inventory Service on failure

### Consumer Groups
- Each service uses its own consumer group
- Ensures each service processes all events independently

### Topics
- `order-events` - Contains order lifecycle events
- `inventory-events` - Contains inventory status events

## Stopping the Services

```bash
docker-compose down

# Remove volumes too
docker-compose down -v
```

## Production Considerations

For production use, consider:
- **Database persistence** - Add PostgreSQL/MongoDB for each service
- **Error handling** - Implement dead letter queues
- **Monitoring** - Add Prometheus and Grafana
- **Kafka UI** - Add kafka-ui for topic management
- **Schema Registry** - Use Confluent Schema Registry for event schemas
- **Security** - Enable Kafka SASL/SSL authentication
- **Scaling** - Increase Kafka partitions and service replicas
- **Observability** - Add distributed tracing (Jaeger/Zipkin)