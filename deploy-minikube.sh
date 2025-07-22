#!/bin/bash

echo "🚀 Converting Docker Compose to Minikube..."

# Start Minikube if not running
if ! minikube status | grep -q "Running"; then
    echo "Starting Minikube..."
    minikube start --memory=4096 --cpus=2
fi

# Enable ingress
minikube addons enable ingress

# Set Docker environment to Minikube
eval $(minikube docker-env)

# Build your app image
echo "📦 Building Laravel app image..."
docker build -t flex-url-app:latest .

# Apply Kubernetes manifests
echo "⚙️ Deploying to Kubernetes..."
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-mysql.yaml

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL..."
kubectl wait --for=condition=ready pod -l app=mysql -n flex-url --timeout=300s

# Deploy Laravel app
kubectl apply -f k8s/02-laravel-app.yaml
kubectl apply -f k8s/03-phpmyadmin.yaml
kubectl apply -f k8s/04-ingress.yaml

# Wait for Laravel app
echo "⏳ Waiting for Laravel app..."
kubectl wait --for=condition=ready pod -l app=laravel-app -n flex-url --timeout=300s

# Add to /etc/hosts
echo "🌐 Setting up local hosts..."
MINIKUBE_IP=$(minikube ip)
echo "Adding entries to /etc/hosts..."
echo "$MINIKUBE_IP laravel.local" | sudo tee -a /etc/hosts
echo "$MINIKUBE_IP phpmyadmin.local" | sudo tee -a /etc/hosts

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your Laravel app is now running on Minikube!"
echo ""
echo "📱 Access URLs:"
echo "   • Laravel App: http://laravel.local"
echo "   • PHPMyAdmin: http://phpmyadmin.local"
echo ""
echo "🔧 Useful commands:"
echo "   • View pods: kubectl get pods -n flex-url"
echo "   • View logs: kubectl logs -f deployment/laravel-app -n flex-url -c php-fpm"
echo "   • Run artisan: kubectl exec -it deployment/laravel-app -n flex-url -c php-fpm -- php artisan"
echo "   • Scale app: kubectl scale deployment laravel-app --replicas=3 -n flex-url"



