import axios from 'axios';
import fs from 'fs';

// Load credentials from .env.local
const envConfig = fs.readFileSync('/Users/adarsh/Documents/antigravity/lucid-carson/.env.local', 'utf-8');
const envVars = {};
envConfig.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const TWILIO_ACCOUNT_SID = envVars.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = envVars.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = envVars.TWILIO_PHONE_NUMBER;
const TARGET_PHONE = '+919137873744';

async function makeOutboundCall() {
  console.log(`🚀 Triggering Outbound AURSGEN Call to ${TARGET_PHONE} from ${TWILIO_PHONE_NUMBER}...`);

  // Official AURSGEN Pitch TwiML (Polly.Aditi Bilingual Hindi + English Speech)
  const twimlXml = `<Response>
    <Say voice="Polly.Aditi" language="hi-IN">
      Namaste! Kya meri baat owner ji se ho rahi hai? Main AURSGEN AI Studio se Alex bol raha hoon. Kya aapke paas 30 seconds hain? Aapke business ke Google reviews aur customer ratings kafi shandar hain! AURSGEN aapke business ke liye 24/7 WhatsApp AI Chatbots aur modern website setup karta hai, jo customer inquiries ka turant jawab dete hain aur lead generate karte hain. Kya hum kal shaam ko ek quick 10 minute ki live preview meeting schedule karein?
    </Say>
  </Response>`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
  const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', TARGET_PHONE);
  params.append('From', TWILIO_PHONE_NUMBER);
  params.append('Url', 'https://twimlets.com/echo?Twiml=' + encodeURIComponent(twimlXml));

  try {
    const response = await axios.post(twilioUrl, params, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('✅ CALL DISPATCHED SUCCESSFULLY!');
    console.log('Call SID:', response.data.sid);
    console.log('Status:', response.data.status);
    console.log('To:', response.data.to);
    console.log('From:', response.data.from);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Twilio Call Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

makeOutboundCall();
