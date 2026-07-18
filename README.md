# WhatsApp Chatbot (Vercel Serverless + Gemini AI)

This repository contains the starter code for a 24/7 WhatsApp Chatbot. It uses Vercel Serverless Functions to host the webhook and Google Gemini API (via Gemini 1.5 Flash) to generate intelligent customer support responses.

## 📁 File Structure
- `api/webhook.js`: The serverless webhook that handles verification from Meta and incoming messages.
- `package.json`: Project dependencies and configuration.

## 🚀 How to Set Up and Deploy

### 1. Get API Keys
- **Google Gemini API Key**: Generate a free API key at [Google AI Studio](https://aistudio.google.com/).
- **Meta Developer Portal**: Register at [Meta for Developers](https://developers.facebook.com/), create a Business app, set up WhatsApp, and obtain:
  - **Temporary Access Token** (or Permanent System User Token)
  - **Phone Number ID**

### 2. Deploy to Vercel (24/7 Free Hosting)
1. Push this project to a private repository on your GitHub account.
2. Go to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Add the following **Environment Variables** in Vercel:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `WHATSAPP_TOKEN`: Your Meta WhatsApp Access Token.
   - `VERIFY_TOKEN`: A custom password string of your choice (e.g. `MySecretToken123`).
5. Click **Deploy**. Vercel will deploy it in seconds and give you a deployment URL (e.g., `https://your-app-name.vercel.app`).
6. Your live webhook URL will be: `https://your-app-name.vercel.app/api/webhook`.

### 3. Configure Webhook in Meta WhatsApp Settings
1. Go back to your Meta App Dashboard under **WhatsApp** -> **Configuration**.
2. Click **Edit** beside Webhook.
3. For **Callback URL**, input `https://your-app-name.vercel.app/api/webhook`.
4. For **Verify Token**, input the custom `VERIFY_TOKEN` you set in Vercel.
5. Click **Verify and Save**.
6. Under **Webhook fields**, click **Manage** and subscribe to **messages**.

Your bot is now live! Send a text message to your test number to test the integration.
