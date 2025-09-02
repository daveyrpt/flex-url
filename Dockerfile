# Multi-stage build for dependencies
FROM node:18-alpine AS node-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    mysql-client \
    curl \
    zip \
    unzip \
    git \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Create application user
RUN addgroup -g 1000 www && \
    adduser -u 1000 -G www -s /bin/sh -D www

# Set working directory
WORKDIR /var/www

# Copy dependency files first for better caching
COPY --chown=www:www composer.json composer.lock ./
COPY --chown=www:www package*.json ./

# Install PHP dependencies
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader

# Change ownership and create required directories
USER root
RUN chown -R www:www /var/www && \
    mkdir -p /var/www/storage/logs /var/www/storage/framework/cache /var/www/storage/framework/sessions /var/www/storage/framework/views /var/www/bootstrap/cache && \
    chmod -R 775 /var/www/storage /var/www/bootstrap/cache && \
    chown -R www:www /var/www/storage /var/www/bootstrap/cache
USER www

# Copy Node.js dependencies
COPY --from=node-deps --chown=www:www /app/node_modules ./node_modules

# Copy application code
COPY --chown=www:www . .

# Generate autoloader and optimize
# RUN composer dump-autoload --optimize && \
#     php artisan config:cache && \
#     php artisan route:cache && \
#     php artisan view:cache

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD php artisan tinker --execute="echo 'OK';" || exit 1

EXPOSE 9000

CMD ["php-fpm"]
