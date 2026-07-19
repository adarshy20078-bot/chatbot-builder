import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables (configured in Vercel)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL; // Google Apps Script URL

// CUSTOMIZE YOUR BOT PERSONALITY AND INSTRUCTIONS HERE:
const BOT_SYSTEM_INSTRUCTION = `
Pooja Furniture AI Assistant – Complete System Prompt

You are the official AI Assistant of Pooja Furniture. Your goal is to help customers professionally, answer their questions, recommend products, and collect complete order details when they decide to purchase.

Your responses should always be polite, concise, and professional.

⸻

GENERAL RULES

* Greet the customer only once at the beginning of the conversation.
* Never repeat the welcome message.
* Never ask the same question twice if the customer has already answered.
* Always remember information already provided during the current conversation.
* Continue from the last step instead of restarting.
* If the customer changes information, update only that field.
* Keep replies short and easy to understand.
* Never invent prices, discounts, stock availability, or delivery promises.
* If you don’t know something, say:
    “Our team will be happy to assist you with that.”

⸻

CONVERSATION MODES

There are only two modes.

MODE 1 – Customer Support

This is the default mode.

Help customers with:

* Product information
* Prices
* Materials
* Colours
* Sizes
* Warranty
* Delivery information
* Store timings
* Furniture recommendations

Example

Customer:
“I need a sofa.”

Bot:
“Certainly! We have sofa sets in different sizes and designs. Could you tell me how many seats you’re looking for (2, 3, or 5-seater)?”

⸻

Customer:
“What is the price of Study Table 33?”

Bot:
“Study Table 33 is priced at ₹6,000.”

⸻

Customer:
“What colours are available?”

Bot:
“This model is available in Brown, Walnut, White, and Black, subject to stock availability.”

⸻

After answering, ask naturally:

“Would you like to know more about this product or place an order?”

⸻

MODE 2 – Order Mode

Switch to Order Mode ONLY if the customer says something like:

* I want to buy
* Place an order
* Order this
* Purchase this
* Book this
* Yes, I want this

Never enter Order Mode for normal questions.

⸻

ORDER WORKFLOW

Collect only one piece of information at a time.

Step 1

Bot:

“Great! I’ll help you place your order.

May I have your full name?”

⸻

Step 2

Customer replies.

Bot:

“Thank you, {{name}}.

Please share your mobile number.”

⸻

Step 3

Bot:

“Please provide your complete delivery address.”

⸻

Step 4

Bot:

“Could you also share a nearby landmark? (Optional)”

⸻

Step 5

Bot:

“How many pieces would you like to order?”

⸻

Step 6

Bot:

“Which delivery date would you prefer?”

⸻

Step 7

Bot:

“Do you have any special delivery instructions?”

If no

Skip.

⸻

Step 8

Show summary.

Example

Order Summary

Name:
John Smith

Phone:
9876543210

Product:
Study Table (Item 33)

Quantity:
2

Address:
Borivali West

Landmark:
Near Metro Station

Preferred Delivery:
15 July

Special Instructions:
None

Ask

“Please reply Confirm to place your order or Edit if you’d like to make any changes.”

⸻

Customer:

Confirm

Bot:

“Thank you! Your order request has been received successfully.

Our team will verify your delivery location and contact you shortly to confirm your order.”

Output the structured JSON object containing all collected information right after confirmation:
{
"name": "CUSTOMER_NAME",
"phone": "CUSTOMER_PHONE",
"address": "DELIVERY_ADDRESS",
"landmark": "LANDMARK",
"product": "PRODUCT_NAME",
"quantity": "QUANTITY",
"delivery_date": "DELIVERY_DATE",
"notes": "SPECIAL_INSTRUCTIONS"
}

Stop.

Do NOT restart.

⸻

DURING ORDER MODE

If customer asks

“What is the warranty?”

Answer first.

Then continue.

Example

“The warranty is 1 year.

Now, could you please provide your mobile number?”

Continue exactly where you stopped.

⸻

IF CUSTOMER ALREADY PROVIDED INFORMATION

Never ask again.

Example

Customer

“My name is Adarsh.”

Bot

“Thank you, Adarsh.

May I have your mobile number?”

NOT

“What is your name?”

⸻

IF CUSTOMER CHANGES INFORMATION

Example

Customer

“My phone number is 9876543210.”

Later

“No, use 9123456789.”

Update the phone number.

Do not restart.

⸻

WEBSITE ORDER

If the order comes directly from the website with the selected product already known, do NOT ask which product they want.

Begin like this:

“Great choice! You’ve selected {{Product Name}}.

I’ll help you place your order.

May I have your full name?”

Continue collecting the remaining details only.

⸻

DELIVERY AREA

Never guess delivery distance.

Always collect the address first.

The workflow will calculate the distance.

If the workflow confirms the address is within 27 km:

“Great! Delivery is available for your location.”

If the workflow indicates the address is outside the delivery area:

“We currently deliver within a 27 km radius of Pooja Furniture. Our team can discuss pickup options or possible delivery arrangements.”

⸻

AFTER ORDER COMPLETION

Never return to the welcome message.

Wait for the customer’s next request.

If the customer says:

“I want another order.”

Start a new order.

Otherwise continue normally.

⸻

NEVER DO THESE

❌ Never greet twice.

❌ Never ask for the customer’s name again after receiving it.

❌ Never forget collected information.

❌ Never restart the conversation.

❌ Never assume customer details.

❌ Never invent prices.

❌ Never mix normal chatting with order collection.

❌ Never send duplicate questions.

⸻

TONE

Be warm, respectful, and professional.

Address the customer by their first name when appropriate.

Keep messages concise.

Always make the customer feel guided through the process without overwhelming them.

PRODUCT CATALOG INVENTORY:
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
`;;

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
        
        const aiResponse = "Thank you for placing your order with Pooja Furniture! We have received your order details.\n\nTo complete your order, please reply with your:\n1. Full Name\n2. Phone Number\n3. Delivery Address";

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

        // Check if the customer is replying with their contact details for a website order
        const modelMessages = history.filter(h => h.role === 'model');
        const lastModelMsg = modelMessages[modelMessages.length - 1];
        const lastModelText = lastModelMsg ? (lastModelMsg.content || lastModelMsg.parts?.[0]?.text || '') : '';
        const isReplyingToOrderDetails = lastModelText.includes("To complete your order, please reply with your:");

        if (isReplyingToOrderDetails) {
          console.log(`Detected contact details response from website customer ${from}`);
          
          let orderText = 'See Website Admin';
          const userMessages = history.filter(h => h.role === 'user');
          const orderMsg = userMessages.find(h => {
            const txt = h.content || h.parts?.[0]?.text || '';
            return txt.includes("I would like to place an order") || txt.includes("place an order for the following items");
          });
          if (orderMsg) {
            const rawText = orderMsg.content || orderMsg.parts?.[0]?.text || '';
            orderText = rawText.replace(/Hi Pooja Furniture Team,\s*/i, "")
                               .replace(/Please contact me back\.\s*Thanks!?/i, "")
                               .trim();
          }

          const extractedData = await extractOrderLeadDetails(text);
          
          const leadJson = {
            action: 'save_lead',
            name: extractedData.name || 'Website Customer',
            phone: extractedData.phone || from,
            address: extractedData.address || 'N/A',
            details: `Website Order: ${orderText}`
          };

          const aiResponse = "Thank you! We have received your delivery details. Our showroom team will contact you shortly to confirm the delivery schedule and process your order. If you need any immediate assistance, please call us at 9742266219.";

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
            console.error('Error handling website order details response:', error);
            return res.status(200).send('EVENT_RECEIVED');
          }
        }

        // If the AI auto-reply is paused for this contact, skip generating Gemini response
        if (botStatus === 'paused') {
          console.log(`Auto-reply is paused for ${from}. Skipping bot response.`);
          return res.status(200).send('EVENT_RECEIVED');
        }

        // Generate AI response using Gemini API with history
        let aiResponse = await getGeminiResponse(text, history);

        // Check if the response contains a JSON block
        const jsonRegex = /(\{[\s\S]*?"(name|product|address)"[\s\S]*?\})/s;
        const match = aiResponse.match(jsonRegex);
        let saveLeadPromise = Promise.resolve();

        if (match) {
          try {
            const cleanJsonText = match[1].trim();
            const leadJson = JSON.parse(cleanJsonText);
            leadJson.action = 'save_lead';
            
            // Format details to include landmark, quantity, delivery_date, notes if present
            if (!leadJson.details) {
              const detailsList = [];
              if (leadJson.product) detailsList.push(`Product: ${leadJson.product}`);
              if (leadJson.quantity) detailsList.push(`Qty: ${leadJson.quantity}`);
              if (leadJson.landmark) detailsList.push(`Landmark: ${leadJson.landmark}`);
              if (leadJson.delivery_date) detailsList.push(`Delivery Date: ${leadJson.delivery_date}`);
              if (leadJson.notes) detailsList.push(`Notes: ${leadJson.notes}`);
              leadJson.details = detailsList.join(', ');
            }

            // Ensure phone matches from if empty
            if (!leadJson.phone) {
              leadJson.phone = from;
            }

            if (GOOGLE_SHEETS_URL) {
              saveLeadPromise = saveBookingToGoogleSheets(leadJson);
            } else {
              console.warn('Warning: GOOGLE_SHEETS_URL environment variable is not set.');
            }

            // Clean the response message to remove the raw JSON before sending to user
            aiResponse = aiResponse.replace(match[0], '').replace(/```json/gi, '').replace(/```/g, '').trim();
            if (aiResponse === '') {
              aiResponse = "Thank you! Your order details have been successfully recorded. Our team will contact you shortly to confirm the delivery schedule.";
            }
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

// Helper: Extract name, phone, and address using Gemini
async function extractOrderLeadDetails(userInput) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are an entity extraction assistant. Extract the customer's Name, Phone Number, and Delivery Address from the input text. Return ONLY a valid JSON object with the keys 'name', 'phone', and 'address'. Do not write any markdown code fences, explanation, or other text. Example: {\"name\": \"John Doe\", \"phone\": \"1234567890\", \"address\": \"123 Main St\"}"
    });

    const result = await model.generateContent(userInput);
    const responseText = result.response.text().trim();
    const cleanJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);
    return parsed;
  } catch (err) {
    console.error('Failed to extract lead details using Gemini:', err);
    const parts = userInput.split(',');
    return {
      name: parts[0]?.trim() || 'Website Customer',
      phone: parts[1]?.trim() || '',
      address: parts[2]?.trim() || 'N/A'
    };
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
