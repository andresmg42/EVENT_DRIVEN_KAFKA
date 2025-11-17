#!/bin/bash

# Create namespace
kubectl apply -f ./namespace.yml

# Deploy Zookeeper (wait for it to be ready)
kubectl apply -f ./zookeeper.yml
kubectl wait --for=condition=ready pod -l app=zookeeper -n microservices --timeout=120s

# Deploy Kafka (wait for it to be ready)
kubectl apply -f ./kafka.yml
kubectl wait --for=condition=ready pod -l app=kafka -n microservices --timeout=180s

# Deploy microservices
kubectl apply -f ./order-service.yml
kubectl apply -f ./inventory-service.yml
kubectl apply -f ./notification-service.yml



# Wait for all services
kubectl wait --for=condition=ready pod --all -n microservices --timeout=180s

#check all resources
kubectl get all -n microservices

#expose outer ports

kubectl port-forward -n microservices svc/order-service 3001:3001 &

kubectl port-forward -n microservices svc/inventory-service 3002:3002 &

kubectl port-forward -n microservices svc/notification-service 3003:3003 &

