#!/bin/bash
set -e

# Ensure dotnet-ef is in PATH
export PATH="$PATH:/root/.dotnet/tools"

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready - running migrations..."

# Run migrations
dotnet-ef database update --project /src/FlowerShop.Infrastructure --startup-project /src/FlowerShop.WebAPI --context ApplicationDbContext

echo "Migrations applied - starting application..."
exec dotnet FlowerShop.WebAPI.dll