# Step-by-Step Deployment Guide - Updating Your Existing Deployment

## 📋 Overview

You already have from Midterm:
- ✅ Cloud Run backend deployed
- ✅ API Gateway configured  
- ✅ Swagger UI working

Now we're adding:
- 🆕 AI Chat feature (Gemini)
- 🆕 React frontend

---

## Step 1: Verify Your Current Setup

### 1.1 Check what's deployed
```bash
# Login to Google Cloud
gcloud auth login

# Set your project (replace with your project ID)
gcloud config set project se4458-bill-payment

# List Cloud Run services
gcloud run services list --region europe-west3

# List API Gateways
gcloud api-gateway gateways list --location europe-west3
```

**Write down:**
- Your Cloud Run service name: ________________
- Your API Gateway name: ________________
- Your current backend URL: ________________

---

## Step 2: Add Gemini API Key to Google Cloud

### 2.1 Create the secret
```bash
# Create secret for Gemini API key
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add your Gemini API key value
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key from https://aistudio.google.com/app/apikey

### 2.2 Verify secret was created
```bash
gcloud secrets list
```

You should see `GEMINI_API_KEY` in the list.

### 2.3 Grant Cloud Run access to the secret
```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 3: Update Backend URL in API Gateway Config

### 3.1 Get your current Cloud Run URL
```bash
gcloud run services describe se4458-api \
  --region europe-west3 \
  --format="value(status.url)"
```

Example output: `https://se4458-api-abc123-ew.a.run.app`

### 3.2 Update api-gateway-config.yaml

**Find and replace** all instances of the old backend URL with your current one.

In your terminal:
```bash
# Get your backend URL
BACKEND_URL=$(gcloud run services describe se4458-api --region europe-west3 --format="value(status.url)")

echo "Your backend URL is: $BACKEND_URL"

# Update the config file (macOS)
sed -i '' "s|https://se4458-api-405686366356.europe-west3.run.app|$BACKEND_URL|g" api-gateway-config.yaml

# Verify changes
grep "address:" api-gateway-config.yaml | head -5
```

All addresses should now point to your current backend URL.

---

## Step 4: Redeploy Backend to Cloud Run

### 4.1 Deploy with new code (includes AI chat)
```bash
# Make sure you're in project directory
cd /Users/instaken/Documents/GitHub/se4458-bill-payment-api

# Deploy (this updates your existing service)
gcloud run deploy se4458-api \
  --source . \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60
```

**Wait 3-5 minutes** for deployment to complete.

### 4.2 Verify deployment
```bash
# Check if service is running
gcloud run services describe se4458-api --region europe-west3

# Test the backend directly
BACKEND_URL=$(gcloud run services describe se4458-api --region europe-west3 --format="value(status.url)")

# Test Swagger UI
curl $BACKEND_URL/api-docs | head -20

# Should return HTML with "Swagger UI"
```

---

## Step 5: Update API Gateway Configuration

### 5.1 Create new API config version
```bash
# Create new config (increment version number)
gcloud api-gateway api-configs create se4458-config-v2 \
  --api=se4458-bill-payment-api \
  --openapi-spec=api-gateway-config.yaml \
  --project=$(gcloud config get-value project) \
  --backend-auth-service-account=$(gcloud iam service-accounts list \
    --filter="displayName:Compute Engine default service account" \
    --format="value(email)")
```

**This takes 5-10 minutes.** Wait for it to complete.

### 5.2 Update gateway to use new config
```bash
# Update your existing gateway
gcloud api-gateway gateways update se4458-gateway \
  --api=se4458-bill-payment-api \
  --api-config=se4458-config-v2 \
  --location=europe-west3
```

**This takes another 5-10 minutes.**

### 5.3 Get your API Gateway URL
```bash
gcloud api-gateway gateways describe se4458-gateway \
  --location=europe-west3 \
  --format="value(defaultHostname)"
```

Example output: `se4458-gateway-abc123.ew.gateway.dev`

**Save this URL!** This is your public endpoint.

---

## Step 6: Test the Deployment

### 6.1 Get your API key
```bash
# List your API keys
gcloud alpha services api-keys list

# If you don't have one, create it
gcloud alpha services api-keys create \
  --display-name="SE4458 Bill Payment Key"
```

**Save your API key!**

### 6.2 Test via API Gateway

Set variables:
```bash
# Your gateway URL (from Step 5.3)
GATEWAY_URL="https://se4458-gateway-abc123.ew.gateway.dev"

# Your API key
API_KEY="your-api-key-here"
```

Test Query Bill:
```bash
curl -X POST "$GATEWAY_URL/api/v1/bills/query?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriberNo": "123456",
    "month": "2024-11"
  }'
```

Expected response:
```json
{
  "subscriberNo": "123456",
  "month": "2024-11",
  "billTotal": 150,
  "paidStatus": "UNPAID"
}
```

### 6.3 Test AI Chat Endpoint

```bash
curl -X POST "$GATEWAY_URL/chat?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my bill for subscriber 123456 for November 2024?",
    "history": []
  }'
```

Expected response:
```json
{
  "text": "Your bill for November 2024 is 150 TL and the status is UNPAID."
}
```

✅ **If you get this response, your AI chat is working!**

---

## Step 7: Deploy React Frontend

### 7.1 Build React app
```bash
cd frontend
npm run build
cd ..
```

This creates `frontend/dist/` folder.

### 7.2 Redeploy backend with React build
```bash
# Deploy again (now includes React build)
gcloud run deploy se4458-api \
  --source . \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 7.3 Access your application

Open browser to: `https://your-gateway-url.ew.gateway.dev/`

You should see the React chat UI!

---

## Step 8: Update README with Your URLs

Update your README.md with your actual URLs:

```markdown
## 📺 Project Demonstration

- **Live Application**: https://se4458-gateway-abc123.ew.gateway.dev/
- **API Documentation**: https://se4458-gateway-abc123.ew.gateway.dev/api-docs
- **Backend (Cloud Run)**: https://se4458-api-abc123-ew.a.run.app
```

---

## 🎯 Summary of What We Did

1. ✅ Added Gemini API key to Google Cloud Secrets
2. ✅ Updated API Gateway config with current backend URL
3. ✅ Redeployed backend with AI chat feature
4. ✅ Updated API Gateway to new config version
5. ✅ Tested all endpoints (Query Bill + AI Chat)
6. ✅ Built and deployed React frontend

---

## 🔍 Troubleshooting

### Backend deployment fails
```bash
# Check logs
gcloud run services logs read se4458-api --region europe-west3 --limit 50
```

### API Gateway returns 404
```bash
# Verify gateway is using latest config
gcloud api-gateway gateways describe se4458-gateway --location=europe-west3
```

### AI Chat not working
```bash
# Check if secret is accessible
gcloud secrets versions access latest --secret="GEMINI_API_KEY"

# Check Cloud Run logs
gcloud run services logs read se4458-api --region europe-west3 --limit 50
```

---

## 📞 Need Help?

If you get stuck at any step, let me know:
1. Which step you're on
2. The exact error message
3. The command you ran

I'll help you fix it! 🚀
