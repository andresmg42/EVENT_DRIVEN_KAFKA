#!/bin/bash

set -e  # stop on first error

echo "Starting Minikube..."
minikube start

echo "Setting Docker environment for Minikube..."
eval $(minikube -p minikube docker-env)

# Build all images
docker build -t order-service:latest ../order-service
docker build -t inventory-service:latest ../inventory-service
docker build -t notification-service:latest ../notification-service

# Verify images are in Minikube
docker images | grep service



