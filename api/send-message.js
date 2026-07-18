import axios from 'axios';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;
const DEFAULT_PHONE_NUMBER_ID = '1227951617061408';

export default async function handler(req, res) {
  // Support GET request for fetching active chats and history
  if (req.method === 'GET') {
    try {
      const { action, phone } = req.query;

      if (action === 'get_active_chats') {
        const response = await axios.get(`${GOOGLE_SHEETS_URL}?action=get_active_chats`);
        return res.status(200).json(response.data);
      }

      if (action === 'get_leads') {
        const response = await axios.get(`${GOOGLE_SHEETS_URL}?action=get_leads`);
        return res.status(200).json(response.data);
      }

      if (action === 'get_history' && phone) {
        const response = await axios.get(`${GOOGLE_SHEETS_URL}?phone=${encodeURIComponent(phone)}`);
        return res.status(200).json(response.data);
      }

      return res.status(400).json({ error: 'Invalid GET parameters' });
    } catch (err) {
      console.error('GET Fetch Error:', err.message || err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  // Support POST request for sending manual messages and updating bot status
  if (req.method === 'POST') {
    try {
      const { phone, message, status } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const phoneNumberId = process.env.PHONE_NUMBER_ID || DEFAULT_PHONE_NUMBER_ID;

      // 1. If status is passed (active/paused), update Google Sheets status
      if (status) {
        await axios.post(GOOGLE_SHEETS_URL, {
          action: 'set_bot_status',
          phone: phone,
          status: status
        });
      }

      // 2. If message is passed, send it to WhatsApp and save it to history
      if (message) {
        // Send manual message to WhatsApp
        await axios.post(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message }
          },
          {
            headers: {
              'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Save agent manual message to Google Sheets chat history
        await axios.post(GOOGLE_SHEETS_URL, {
          action: 'append_history',
          phone: phone,
          role: 'model', // Logged as model role so history context aligns
          content: message
        });
        
        // Auto-pause bot for this phone number so AI doesn't double-reply
        await axios.post(GOOGLE_SHEETS_URL, {
          action: 'set_bot_status',
          phone: phone,
          status: 'paused'
        });
      }

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Send Message Error:', error.response ? error.response.data : error.message);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
