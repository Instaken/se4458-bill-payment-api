#!/bin/bash

# SE 4458 - Deployment Script for AI Agent Update
# This script updates your existing deployment with the new AI chat feature

set -e  # Exit on error

# Your specific configuration
PROJECT_ID="backend-midterm-se4458"
SERVICE_NAME="se4458-api"
GATEWAY_NAME="se4458-gateway"
REGION="europe-west3"
GATEWAY_REGION="europe-west1"

echo "🚀 SE 4458 - Deploying AI Agent Chat Application"
echo "=================================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Gateway: $GATEWAY_NAME"
echo "Region: $REGION"
echo ""

# Step 1: Set project
echo "📍 Step 1: Setting Google Cloud project..."
gcloud config set project $PROJECT_ID

# Step 2: Check if Gemini API key secret exists
echo ""
echo "🔑 Step 2: Checking Gemini API key secret..."
if gcloud secrets describe gemini-api-key &>/dev/null; then
    echo "✅ GEMINI_API_KEY secret already exists"
else
    echo "❌ GEMINI_API_KEY secret not found"
    echo ""
    echo "Please create it first:"
    echo "1. Get your Gemini API key from: https://aistudio.google.com/app/apikey"
    echo "2. Run this command:"
    echo "   gcloud secrets create GEMINI_API_KEY --replication-policy='automatic'"
    echo "   echo -n 'YOUR_KEY_HERE' | gcloud secrets versions add GEMINI_API_KEY --data-file=-"
    echo ""
    read -p "Press Enter after you've created the secret, or Ctrl+C to exit..."
fi

# Step 3: Get current backend URL
echo ""
echo "🌐 Step 3: Getting current backend URL..."
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format="value(status.url)")

echo "Current backend URL: $BACKEND_URL"

# Step 4: Update API Gateway config
echo ""
echo "📝 Step 4: Updating API Gateway configuration..."
echo "Replacing backend URLs in api-gateway-config.yaml..."

# Backup original file
cp api-gateway-config.yaml api-gateway-config.yaml.backup

# Replace all backend URLs
sed -i.tmp "s|https://se4458-api-[^/]*\.run\.app|$BACKEND_URL|g" api-gateway-config.yaml
rm -f api-gateway-config.yaml.tmp

echo "✅ API Gateway config updated"

# Step 5: Deploy backend to Cloud Run
echo ""
echo "🚢 Step 5: Deploying backend to Cloud Run..."
echo "This will take 3-5 minutes..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60

echo ""
echo "✅ Backend deployed successfully!"

# Get updated backend URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format="value(status.url)")

echo "Backend URL: $BACKEND_URL"

# Step 6: Create new API Gateway config
echo ""
echo "🔧 Step 6: Creating new API Gateway configuration..."
echo "This will take 5-10 minutes..."
echo ""

# Get current timestamp for version
VERSION="v$(date +%Y%m%d-%H%M%S)"

# Get service account
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:Compute Engine default service account" \
  --format="value(email)")

gcloud api-gateway api-configs create se4458-config-$VERSION \
  --api=se4458-backend-api \
  --openapi-spec=api-gateway-config.yaml \
  --project=$PROJECT_ID \
  --backend-auth-service-account=$SERVICE_ACCOUNT

echo ""
echo "✅ API config created: se4458-config-$VERSION"

# Step 7: Update API Gateway
echo ""
echo "🔄 Step 7: Updating API Gateway..."
echo "This will take 5-10 minutes..."
echo ""

gcloud api-gateway gateways update $GATEWAY_NAME \
  --api=se4458-backend-api \
  --api-config=se4458-config-$VERSION \
  --location=$GATEWAY_REGION

echo ""
echo "✅ API Gateway updated!"

# Step 8: Get Gateway URL
echo ""
echo "🌍 Step 8: Getting your application URLs..."
GATEWAY_URL=$(gcloud api-gateway gateways describe $GATEWAY_NAME \
  --location=$GATEWAY_REGION \
  --format="value(defaultHostname)")

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "Your application is now live at:"
echo ""
echo "🌐 Gateway URL: https://$GATEWAY_URL"
echo "📚 API Docs:    https://$GATEWAY_URL/api-docs"
echo "💬 Chat UI:     https://$GATEWAY_URL/"
echo "🔧 Backend:     $BACKEND_URL"
echo ""
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Get your API key: gcloud alpha services api-keys list"
echo "2. Test the chat endpoint (see DEPLOYMENT_STEPS.md)"
echo "3. Update README.md with your URLs"
echo ""
echo "Backup file created: api-gateway-config.yaml.backup"
echo ""
