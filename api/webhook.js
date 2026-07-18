import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables (configured in Vercel)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL; // Google Apps Script URL

// CUSTOMIZE YOUR BOT PERSONALITY AND INSTRUCTIONS HERE:
const BOT_SYSTEM_INSTRUCTION = `
You are a professional customer support assistant for "Pooja Furniture" on WhatsApp.
Your goal is to politely answer customer inquiries and guide them step-by-step through the following predefined workflow. Do not skip or combine steps.

STORE & DELIVERY RULES:
- Showroom Name: Pooja Furniture & Appliances
- Address: #114 Chikka Devasandra Bus Stop, Devasandra main road K.R Puram Bengaluru - 560036
- Contact Number: 9742266219
- Official Website: https://poojafurniture.shop/
- Website Reference: If customers ask to see photos, browse the full collection, or view products online, always direct them to our official website: https://poojafurniture.shop/
- Delivery Limits: We ONLY deliver within a 25-30 km radius of our showroom in K.R Puram, Bengaluru. Absolutely NO orders or deliveries can be processed or fulfilled outside this area.

WORKFLOW RULES:
1. Welcome & Greeting:
   - At the beginning of a conversation or if the customer greets you (e.g., "Hi", "Hello", "Hey", etc.), you MUST reply ONLY with: "Welcome to Pooja Furniture! How can I help you today?"
   - Do NOT ask them about sofa types, budgets, or models in this greeting message. Wait for them to state what they are looking for first.
2. Product Selection (e.g., Sofa):
   - Once they respond stating they want a sofa (or other product), ask: "Please choose a sofa type and share your budget."
   - Once they share their budget (e.g., "30,000"), ask: "What color and size do you prefer?"
   - Once they share color and size preferences (e.g., "Grey"), ask: "Please share your delivery area/city and PIN code to check delivery availability."
   - Once they share their location:
     * If the location is within Bengaluru and within our 25-30 km delivery radius from K.R Puram, reply: "Delivery is available. Would you like our catalogue, pricing, or a showroom visit?"
     * If the location is OUTSIDE Bengaluru or further than 30 km from K.R Puram, reply: "I'm sorry, we only deliver within a 25-30 km radius of our showroom in K.R Puram, Bengaluru. We cannot accept or process orders outside this area. If you have any questions, you can contact us at 9742266219." Stop the workflow here and do not proceed to collect leads.
3. Options (Catalogue/Pricing/Showroom):
   - If they ask for "Catalogue": Reply with "Catalogue sent. Which model would you like a quotation for?"
   - If they ask for "Pricing" or "Showroom visit", respond appropriately and ask which model/items they are interested in.
4. Lead Collection:
   - Once they specify a model (e.g., "S102"), ask for their name, phone number, and delivery address. You can ask: "Please share your name, phone number, and delivery address."
   - Once (and only once) you have successfully collected the customer's Name, Phone number, and Delivery Address, reply with:
     "Thank you. Our team will contact you shortly with your quotation."
     AND append this exact hidden tag at the very end of your final response:
     [LEAD_DATA: {"name": "CUSTOMER_NAME", "phone": "CUSTOMER_PHONE", "address": "CUSTOMER_DELIVERY_ADDRESS", "details": "INQUIRY_SUMMARY"}]
     - Replace CUSTOMER_NAME, CUSTOMER_PHONE, and CUSTOMER_DELIVERY_ADDRESS with the provided details.
     - Replace INQUIRY_SUMMARY with a brief description of their request (e.g., "Sofa, Budget: 30000, Grey, PIN: 560036, Model: S102").
     - Do not include the [LEAD_DATA: ...] tag if you are still gathering details.

SPECIFIC INQUIRY ANSWERS:
- Location / Address: If asked for your showroom location or address, reply: "Pooja Furniture & Appliances, #114 Chikka Devasandra Bus Stop, Devasandra main road K.R Puram Bengaluru - 560036."
- Contact Number / Mobile: If asked how to reach you, reply: "You can contact us at 9742266219."
- Customization: If asked "Do you offer customization?", reply: "Yes, we customize size, color, material, and dimensions."
- Delivery Time: If asked "How long is delivery?", reply: "Usually 7–21 days depending on stock and customization."
- Installation: If asked "Do you provide installation?", reply: "Yes, where applicable."
- Warranty: If asked "What is the warranty?", reply: "Warranty depends on the product and will be mentioned in your quotation."
- Order Tracking: If asked "Track my order", reply: "Please share your order ID or registered mobile number."

PRODUCT CATALOG INVENTORY (Use this for answering any product or price inquiries):
Category: Beds
1. Sheesham Wood Cot (Premium) - Price: ₹27,500 | Rating: 16 | Colors: Natural Teak, Dark Walnut | Material: Solid Sheesham Wood
2. Mysore Teak Navapan Board Sheet Cot - Price: ₹10,500 | Rating: 11 | Colors: Teak Finish | Material: Mysore Teak & Navapan Board
3. Luxury Upholstery Cot - Price: ₹25,000 | Rating: 23 | Colors: Beige Velvet, Royal Blue Velvet | Material: Premium Upholstery fabric
4. Head Storage Hydraulic Cot - Price: ₹25,000 | Rating: 19 | Colors: Honey Glaze, Dark Wenge | Feature: Hydraulic lifting headboard storage | Material: Solid Wood
5. Diamond Sheesham Wood Bed - Price: ₹28,999 | Rating: 42 | Colors: Natural Teak, Dark Walnut | Material: Premium Sheesham Wood
6. Niwar Basketweave Bed - Price: ₹29,999 | Rating: 28 | Colors: Natural Teak, Dark Walnut | Design: Niwar Basketweave headboard
7. Audi Premium Wooden Bed - Price: ₹25,999 | Rating: 12 | Colors: Natural Teak, Dark Walnut | Material: Premium Hardwood
8. Rajana Classical Panel Bed - Price: ₹27,999 | Rating: 15 | Colors: Honey Glaze | Style: Classical Panel Bed
9. Kuber Premium Storage Bed - Price: ₹32,999 | Rating: 22 | Colors: Natural Teak | Feature: Built-in drawer/box storage
10. Rajasthan Traditional Tile Bed - Price: ₹32,999 | Rating: 36 | Colors: Traditional Wood Finish | Feature: Decorative ceramic tile headboard inlay
11. Mysore Teak with Navapan Board Sheet Cot - Price: ₹11,000 | Rating: 16 | Material: Teak & Navapan board

Category: Living Room
12. Ring Bed Side Table - Price: ₹4,999 | Rating: 16 | Style: Circular Bedside table
13. Sheesham Wood Japanese Mini Table / Coffee Table - Price: ₹12,000 | Rating: 34 | Material: Solid Sheesham Wood | Style: Low-profile Japanese design
14. Royal Velvet Sectional Cot - Price: ₹38,999 | Rating: 11 | Color: Royal Blue | Style: L-shaped sectional sofa cot
15. Charlie Sofa - Price: ₹18,500 | Rating: 14 | Color: Brown | Material: Soft fabric upholstery
16. Charlie Sofa Set - Price: ₹18,500 | Rating: 27 | Color: Beige | Material: Premium upholstery
17. Solid Wood 2-Seater Sofa - Price: ₹15,999 | Rating: 11 | Material: Hardwood frame, fabric cushions
18. Handle & Plain Divan Bench Collection - Price: ₹3,500 | Rating: 19 | Style: Divan bench for seating/bedside
19. Classic Sheesham Wood Easy Chair - Price: ₹8,999 | Rating: 23 | Feature: Ergonomic rocking/relaxing chair
20. Wooden Sofa Set (3+1+1) - Price: ₹29,000 | Rating: 13 | Material: Solid wood frames
21. LCD Stand - Price: ₹8,000 | Rating: 29 | Material: Engineered wood, spacious shelving
22. Corner Sofa Set - Price: ₹50,000 | Rating: 8 | Style: Premium Corner sectional sofa
23. 3+2 Sofa Set - Price: ₹35,000 | Rating: 11 | Upholstery: Fabric/Leatherette
24. Sheesham Wood Tea Table - Price: ₹6,000 | Rating: 18 | Material: Solid Sheesham Wood
25. Wooden Tepai - Price: ₹4,000 | Rating: 7 | Material: Traditional wooden coffee stool
26. Glass Tepai - Price: ₹5,500 | Rating: 9 | Material: Glass top coffee table with wooden base

Category: Dining
27. Plan Solid Sheesham Dining Set - Price: ₹25,000 | Rating: 8 | Material: 100% Solid Sheesham Wood
28. Kuber Solid Wood Dining Set - Price: ₹29,000 | Rating: 33 | Style: Premium dining table with chairs
29. Luxury Tile Dining Set (Royal Blue) - Price: ₹28,000 | Rating: 15 | Feature: Blue ceramic tile tabletop inlay
30. Luxury Tile Dining Set (Charcoal Grey) - Price: ₹28,000 | Rating: 22 | Feature: Grey ceramic tile tabletop inlay
31. Premium Tile Dining Set (Quilted Brown) - Price: ₹45,999 | Rating: 31 | Feature: 6-seater brown tiled tabletop dining set
32. Amar Bar Stool - Price: ₹4,999 | Rating: 9 | Style: Solid wood tall bar stool

Category: Office
33. Study Table - Price: ₹6,000 | Rating: 9 | Style: Compact home study desk
34. Pooja Boss Chair (Ergonomic) - Price: ₹6,500 | Rating: 12 | Feature: High-back executive chair, lumbar support
35. Pooja Visitor Chair - Price: ₹2,500 | Rating: 21 | Style: Low-back visitor chair
36. Office Table - Price: ₹3,500 | Rating: 16 | Style: Office writing desk
37. Pooja Ergonomic Office Chair - Price: ₹5,500 | Rating: 32 | Feature: Mid-back mesh office chair

Category: Storage
38. Sheesham Wood Mandir - Price: ₹4,500 | Rating: 38 | Material: Solid Sheesham Wood Pooja Mandir
39. Premium Swing Wardrobe Collection - Price: ₹6,500 | Rating: 21 | Style: Multi-door swing wardrobe
40. Iron Rack - Price: ₹3,500 | Rating: 14 | Material: Industrial steel storage shelving
41. Nilkamal PVC Shoe Racks - Price: ₹5,500 | Rating: 14 | Material: High-grade PVC shoe storage cabinet

Category: Mattresses
42. Pooja Co. Branded Mattress Selection - Price: ₹7,999 | Rating: 51 | Type: Orthopedic/Memory Foam mattresses
`;

export default async function handler(req, res) {
  // 1. Webhook Verification (Meta checks this when you configure the Webhook URL)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Forbidden');
      }
    }
  }

  // 2. Handling Incoming Messages
  if (req.method === 'POST') {
    const body = req.body;
    console.log('Incoming Webhook Body:', JSON.stringify(body));

    let from = null;
    let text = null;
    let phone_number_id = null;
    let provider = 'meta';

    // Check if Meta format
    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      from = message.from; // Customer's phone number
      text = message.text ? message.text.body : null;
      phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
      provider = 'meta';
    } 
    // Check if AiSensy format
    else if (body.topic && body.data) {
      const msgData = body.data.message || {};
      const senderData = body.data.sender || {};
      from = senderData.id || msgData.from || body.data.to;
      text = msgData.text?.body || msgData.body || (typeof msgData.text === 'string' ? msgData.text : null);
      provider = 'aisensy';
    }

    if (text && from) {
      // 1. Detect if this is an automated website order confirmation message
      const isWebsiteOrder = text.includes("I would like to place an order for the following items") || 
                             text.includes("place an order for the following items");

      if (isWebsiteOrder) {
        console.log(`Detected website order from ${from}`);
        
        let orderDetails = text.replace(/Hi Pooja Furniture Team,\s*/i, "")
                              .replace(/Please contact me back\.\s*Thanks!?/i, "")
                              .trim();
        
        const leadJson = {
          action: 'save_lead',
          name: 'Website Customer',
          phone: from,
          address: 'Check Website Admin / Order Details',
          details: `Website Order: ${orderDetails}`
        };

        const aiResponse = "Thank you for placing your order with Pooja Furniture! We have received your order details. Our team will contact you shortly to confirm your delivery details and process your order. If you need any immediate assistance, you can also reach us directly at 9742266219.";

        let saveLeadPromise = Promise.resolve();
        if (GOOGLE_SHEETS_URL) {
          saveLeadPromise = saveBookingToGoogleSheets(leadJson);
        }

        let saveHistoryPromise = Promise.resolve();
        if (GOOGLE_SHEETS_URL) {
          saveHistoryPromise = postToGoogleSheets(GOOGLE_SHEETS_URL, {
            action: "append_history",
            phone: from,
            turns: [
              { role: "user", content: text },
              { role: "model", content: aiResponse }
            ]
          }).catch(histErr => console.error('Failed to save history:', histErr));
        }

        let sendPromise = Promise.resolve();
        if (provider === 'aisensy') {
          const AISENSY_PROJECT_ID = process.env.AISENSY_PROJECT_ID;
          const AISENSY_API_PWD = process.env.AISENSY_API_PWD;
          sendPromise = sendAiSensyMessage(AISENSY_PROJECT_ID, AISENSY_API_PWD, from, aiResponse);
        } else {
          sendPromise = sendWhatsAppMessage(phone_number_id, from, aiResponse);
        }

        try {
          await Promise.all([
            sendPromise,
            saveLeadPromise,
            saveHistoryPromise
          ]);
          return res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
          console.error('Error handling website order webhook:', error);
          return res.status(200).send('EVENT_RECEIVED');
        }
      }

      try {
        // Fetch chat history from Google Sheets (stateless memory)
        let history = [];
        let botStatus = 'active';
        if (GOOGLE_SHEETS_URL) {
          try {
            const historyRes = await axios.get(`${GOOGLE_SHEETS_URL}?phone=${encodeURIComponent(from)}`);
            if (historyRes.data) {
              if (historyRes.data.history) {
                history = historyRes.data.history;
              }
              if (historyRes.data.bot_status) {
                botStatus = historyRes.data.bot_status;
              }
            }
          } catch (histErr) {
            console.error('Failed to fetch history:', histErr);
          }
        }

        // If the AI auto-reply is paused for this contact, skip generating Gemini response
        if (botStatus === 'paused') {
          console.log(`Auto-reply is paused for ${from}. Skipping bot response.`);
          return res.status(200).send('EVENT_RECEIVED');
        }

        // Generate AI response using Gemini API with history
        let aiResponse = await getGeminiResponse(text, history);

        // Check if the response contains a lead payload
        const leadRegex = /\[LEAD_DATA:\s*(\{.*?\})\s*\]/s;
        const match = aiResponse.match(leadRegex);
        let saveLeadPromise = Promise.resolve();

        if (match) {
          try {
            const leadJson = JSON.parse(match[1]);
            leadJson.action = 'save_lead';
            
            // Prepare the save lead call
            if (GOOGLE_SHEETS_URL) {
              saveLeadPromise = saveBookingToGoogleSheets(leadJson);
            } else {
              console.warn('Warning: GOOGLE_SHEETS_URL environment variable is not set.');
            }

            // Clean the response message to remove the lead tag before sending to user
            aiResponse = aiResponse.replace(leadRegex, '').trim();
          } catch (jsonErr) {
            console.error('Failed to parse or save lead JSON:', jsonErr);
          }
        }

        // Save the current turn (user message & model response) back to Sheets history in a single call to save time
        let saveHistoryPromise = Promise.resolve();
        if (GOOGLE_SHEETS_URL) {
          saveHistoryPromise = postToGoogleSheets(GOOGLE_SHEETS_URL, {
            action: "append_history",
            phone: from,
            turns: [
              { role: "user", content: text },
              { role: "model", content: aiResponse }
            ]
          }).catch(histErr => console.error('Failed to save history:', histErr));
        }

        // Send message to WhatsApp, write to Google Sheets, and update history in parallel to save time.
        // We MUST await all before ending the function, otherwise Vercel freezes the execution context.
        let sendPromise;
        const AISENSY_PROJECT_ID = process.env.AISENSY_PROJECT_ID;
        const AISENSY_API_PWD = process.env.AISENSY_API_PWD;

        if (provider === 'aisensy' && AISENSY_PROJECT_ID && AISENSY_API_PWD) {
          sendPromise = sendAiSensyMessage(AISENSY_PROJECT_ID, AISENSY_API_PWD, from, aiResponse);
        } else {
          sendPromise = sendWhatsAppMessage(phone_number_id, from, aiResponse);
        }

        await Promise.all([
          sendPromise,
          saveLeadPromise,
          saveHistoryPromise
        ]);

        // Acknowledge receipt to provider only after all work is done
        return res.status(200).send('EVENT_RECEIVED');
      } catch (error) {
        console.error('Error handling message:', error);
        // Always return 200 OK on errors to prevent retries indefinitely and causing spam
        return res.status(200).send('EVENT_RECEIVED');
      }
    } else {
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

// Helper: Call Gemini API using the official SDK with history context
async function getGeminiResponse(userInput, history) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: BOT_SYSTEM_INSTRUCTION
    });

    // Clean and validate history for Gemini SDK requirements:
    // 1. Must alternate between 'user' and 'model'
    // 2. Must start with 'user'
    let cleanHistory = [];
    if (history && Array.isArray(history)) {
      // Ensure each item has the correct structure (parts containing text)
      const mappedHistory = history.map(item => {
        if (item.parts && Array.isArray(item.parts)) {
          return item;
        }
        return {
          role: item.role,
          parts: [{ text: item.content || '' }]
        };
      });

      // Ensure the history array starts with a 'user' message
      let startIndex = 0;
      while (startIndex < mappedHistory.length && mappedHistory[startIndex].role !== 'user') {
        startIndex++;
      }

      // Build alternating turns
      let lastRole = null;
      for (let i = startIndex; i < mappedHistory.length; i++) {
        const turn = mappedHistory[i];
        if (turn.role === 'user' || turn.role === 'model') {
          if (turn.role !== lastRole) {
            cleanHistory.push(turn);
            lastRole = turn.role;
          } else {
            // If consecutive same role, append message text to the last one
            const lastTurn = cleanHistory[cleanHistory.length - 1];
            const newText = turn.parts?.[0]?.text || '';
            if (lastTurn && lastTurn.parts?.[0]) {
              lastTurn.parts[0].text += '\n' + newText;
            }
          }
        }
      }
    }

    const chat = model.startChat({
      history: cleanHistory
    });

    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini SDK Error:', error.message || error);
    return "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
  }
}

// Helper: POST data to Google Apps Script Web App (Axios automatically handles the 302 redirect via GET to return response)
async function postToGoogleSheets(url, data) {
  const response = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
}

// Helper: Forward booking payload to Google Sheets Apps Script
async function saveBookingToGoogleSheets(bookingData) {
  try {
    const response = await postToGoogleSheets(GOOGLE_SHEETS_URL, bookingData);
    console.log('Successfully saved to Google Sheets:', response);
  } catch (error) {
    console.error('Google Sheets Save Error:', error.message || error);
  }
}

// Helper: Call WhatsApp Cloud API to send reply
async function sendWhatsAppMessage(phone_number_id, to, replyText) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: replyText }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('WhatsApp Send API Error:', error.response ? error.response.data : error.message);
  }
}

// Helper: Call AiSensy Project API to send reply
async function sendAiSensyMessage(projectId, apiPwd, to, replyText) {
  try {
    const cleanTo = to.replace('+', '');
    await axios.post(
      `https://apis.aisensy.com/project-apis/v1/project/${projectId}/messages`,
      {
        to: cleanTo,
        type: 'text',
        recipient_type: 'individual',
        text: { body: replyText }
      },
      {
        headers: {
          'X-AiSensy-Project-API-Pwd': apiPwd,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('AiSensy Send API Error:', error.response ? error.response.data : error.message);
  }
}
