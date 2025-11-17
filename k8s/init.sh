#!/bin/bash

# Point your shell to Minikube's Docker daemon
# eval $(minikube docker-env)

# Build all images
docker build -t order-service:latest ../order-service
docker build -t inventory-service:latest ../inventory-service
docker build -t notification-service:latest ../notification-service

# Verify images are in Minikube
docker images | grep service



