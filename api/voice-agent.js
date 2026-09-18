import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Lqr0YBQKUbjaIoEwS9n4J31hU-FQByxFUQ7WyTAnQfzw';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '37d8ca4f25bc1bf1d495b26219d92c9452cfd779';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_9ad6c2235f9fd999cdf3f39e4039170eb3a67be316dd3006';

// Helper: Convert English technical brand words into clean Devanagari phonetics for 100% PERFECT pronunciation
export function phoneticHinglishCleaner(text) {
  if (!text) return '';
  return text
    .replace(/AURSGEN/gi, 'ऑर्सजेन')
    .replace(/WhatsApp/gi, 'व्हाट्सएप')
    .replace(/Chatbots?/gi, 'चैटबॉट')
    .replace(/Websites?/gi, 'वेबसाइट')
    .replace(/Google/gi, 'गूगल')
    .replace(/Reviews?/gi, 'रिव्यू')
    .replace(/Leads?/gi, 'लीड')
    .replace(/Catalogue/gi, 'कैटलॉग')
    .replace(/Instagram/gi, 'इंस्टाग्राम')
    .replace(/Automation/gi, 'ऑटोमेशन')
    .replace(/Appointments?/gi, 'अपॉइंटमेंट')
    .replace(/Booking/gi, 'बुकिंग')
    .replace(/Preview/gi, 'प्रिव्यू')
    .replace(/[*#_]/g, '')
    .trim();
}

// In-Memory Call Summary Database for Excel Export
export let EXCEL_CALL_SUMMARIES = [
  {
    call_id: "call_101",
    timestamp: "2026-08-06 15:20",
    lead_name: "Dr. Marcus Vance",
    business_name: "Pinnacle Dental Care",
    phone: "+1 (415) 555-0199",
    niche: "Dental",
    duration: "2m 15s",
    interest_status: "Meeting Booked 🔥",
    interest_score: "5/5 Stars",
    pain_points: "Front desk misses patient appointment calls & WhatsApp messages after hours.",
    ai_summary: "AI Sales Master held a natural 2-way conversation in Hinglish. Pitched 24/7 WhatsApp AI Chatbot & Website lead generation, secured 10-minute preview meeting.",
    agreed_next_step: "Booked 10-minute preview meeting for tomorrow."
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body?.action;

  try {
    if (req.method === 'GET' && action === 'get_excel_summaries') {
      return res.status(200).json({ status: 'success', data: EXCEL_CALL_SUMMARIES });
    }

    if (req.method === 'GET' && action === 'export_excel_csv') {
      let csvContent = "Call ID,Timestamp,Lead Name,Business Name,Phone Number,Niche,Duration,Status,Score,Pain Points,AURSGEN AI Summary,Next Steps\n";
      EXCEL_CALL_SUMMARIES.forEach(row => {
        csvContent += `"${row.call_id}","${row.timestamp}","${row.lead_name}","${row.business_name}","${row.phone}","${row.niche}","${row.duration}","${row.interest_status}","${row.interest_score}","${row.pain_points.replace(/"/g, '""')}","${row.ai_summary.replace(/"/g, '""')}","${row.agreed_next_step.replace(/"/g, '""')}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="AURSGEN_AI_Call_Summaries.csv"');
      return res.status(200).send(csvContent);
    }

    if (req.method === 'POST' && action === 'simulate_voice_chat') {
      const { userMessage, history, leadContext } = req.body;
      const aiReply = await runGeminiUltraSalesAgent(userMessage, history, leadContext);
      return res.status(200).json({ status: 'success', reply: aiReply });
    }

    return res.status(400).json({ error: 'Unsupported action' });
  } catch (error) {
    console.error('[AURSGEN Voice Agent API Error]', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// ULTRA-INTELLIGENT DYNAMIC AI SALES MASTER (POWERED BY GEMINI AI)
async function runGeminiUltraSalesAgent(userMessage, history, leadContext) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const business = leadContext?.business || 'Pooja Furniture Studio';
    const name = leadContext?.name || 'Pooja ji';
    const niche = leadContext?.niche || 'Furniture';

    const systemPrompt = `You are Bunty, a fun, energetic, warm, hyper-intelligent Senior AI Sales Executive and Podcast Host at AURSGEN.
Your company, AURSGEN, specializes in:
1. High-converting Modern Websites
2. 24/7 WhatsApp AI Chatbots (answers inquiries, sends catalogs, books appointments 24/7)
3. Business AI Lead Automation

Target Prospect Info:
- Client Name: ${name}
- Business Name: ${business}
- Industry: ${niche}

Rules for Your Speech Response:
1. Speak in Bunty's signature fun, relatable, enthusiastic Indian Hinglish (mix of natural English and clear Hindi).
2. Keep responses short, punchy, and super engaging (1-2 sentences maximum per reply, exactly like an awesome podcast host talking on a call).
3. Do NOT read from a rigid script! Think dynamically, listen to what the prospect says, handle objections with high empathy and energy, and gently guide the conversation towards booking a quick 10-minute free preview meeting.
4. If the prospect says "nahi chahiye" or "not interested", respond with high warmth ("Bilkul samajh sakta hoon sir!"), highlight how 24/7 WhatsApp automation turns passive visitors into paying leads, and offer a zero-risk 1-minute WhatsApp preview demo.
5. If the prospect agrees or asks a question, answer intelligently and close for a 10-minute preview meeting.`;

    const chatHistoryFormatted = (history || []).map(h => `${h.role === 'agent' ? 'Kanika' : 'Prospect'}: ${h.content}`).join('\n');

    const prompt = `${systemPrompt}

Conversation History So Far:
${chatHistoryFormatted}

Prospect just said: "${userMessage}"

Generate Kanika's next short, natural, intelligent spoken reply (1-2 sentences in natural Hinglish):`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/[*#_]/g, '');

    return responseText;
  } catch (err) {
    console.warn('[Gemini AI Fallback]', err.message);
    const text = (userMessage || '').toLowerCase();
    if (text.includes('nahi') || text.includes('nhi')) {
      return "Bilkul samajh sakti hoon sir! Lekin hamara 24/7 WhatsApp AI Chatbot aapke business inquiries ko automatic leads mein convert karta hai. Kya main aapko 1-minute ka free WhatsApp preview bhej sakti hoon?";
    }
    return "Bahut badiya sir! AURSGEN aapke business ke liye 24/7 WhatsApp AI Chatbots aur Websites setup karta hai jo leads auto-convert karte hain. Kya hum kal shaam ko 10-minute preview meeting schedule karein?";
  }
}
