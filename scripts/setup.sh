#!/bin/bash
# Setup script for deployment

echo "=== NeverBrokeAgain Setup ==="

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm prisma migrate deploy

# Seed plans
pnpm db:seed

# Start PM2
pnpm pm2:start
pnpm pm2:save

echo "Done!"
