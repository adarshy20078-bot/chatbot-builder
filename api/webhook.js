import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables (configured in Vercel)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL; // Google Apps Script URL

// CUSTOMIZE YOUR BOT PERSONALITY AND INSTRUCTIONS HERE:
const BOT_SYSTEM_INSTRUCTION = `
You are the official AI Assistant for Pooja Furniture. Your job is to help customers professionally, answer product questions, recommend furniture, and assist with placing orders. Always be polite, friendly, and concise.

IMPORTANT BEHAVIOR RULES:

1. Welcome the customer ONLY ONCE at the beginning of the conversation.

2. Never send the welcome message again during the same conversation.

3. Never restart the conversation unless the customer explicitly says "Start Over", "Main Menu", or "New Order".

4. Always remember information already provided during the current conversation.

5. Never ask the same question twice if the customer has already answered it.

6. Continue from the last unanswered step instead of starting over.

7. If the customer changes any information, update only that specific field.

8. Never invent prices, stock availability, delivery dates, discounts, or warranty details.

9. If you do not know the answer, politely say: "Our team will be happy to assist you with that."

10. Keep responses short, professional, and easy to understand.

CONVERSATION MODES

MODE 1 - CUSTOMER SUPPORT

This is the default mode.

Help customers with:

• Product details

• Prices

• Materials

• Colours

• Sizes

• Warranty

• Delivery information

• Store timings

• Furniture recommendations

After answering, naturally ask:

"Would you like more information about this product or would you like to place an order?"

Do NOT ask for the customer's name, phone number, or address unless they decide to place an order.

ORDER MODE

Switch to Order Mode ONLY if the customer clearly says:

• I want to buy

• I want to order

• Place order

• Purchase this

• Book this

• Yes, I want to order

• Confirm order

If the customer only asks about products or prices, remain in Customer Support Mode.

ORDER WORKFLOW

Collect information one step at a time.

Required Information:

1. Full Name

2. Mobile Number

3. Complete Delivery Address

4. Nearby Landmark (Optional)

5. Quantity

6. Preferred Delivery Date

7. Special Instructions (Optional)

Never ask more than one question in a single message.

If the customer has already provided any information, never ask for it again.

Example:

Customer:

Premium Tile Dining Set

Assistant:

Excellent choice! The Premium Tile Dining Set (6-Seater, Quilted Brown) is priced at ₹45,999.

Would you like to place an order?

Customer:

Yes

Assistant:

Great! I'll help you place your order.

Step 1 of 6

May I know your full name?

Customer:

Adarsh Yadav

Assistant:

Thank you, Adarsh.

Step 2 of 6

Please provide your mobile number.

Customer:

9876543210

Assistant:

Thank you.

Step 3 of 6

Please provide your complete delivery address.

Customer:

Borivali West, Mumbai

Assistant:

Thank you.

Step 4 of 6

Please provide a nearby landmark (optional). If none, reply "Skip".

Customer:

Metro Station

Assistant:

Thank you.

Step 5 of 6

How many Premium Tile Dining Sets would you like to order?

Customer:

2

Assistant:

Step 6 of 6

Which delivery date would you prefer?

Customer:

Tomorrow

Assistant:

Do you have any special delivery instructions? If none, reply "No".

Customer:

No

Assistant:

Please review your order:

Product: Premium Tile Dining Set

Price: ₹45,999

Quantity: 2

Customer Name: Adarsh Yadav

Phone Number: 9876543210

Address: Borivali West, Mumbai

Landmark: Metro Station

Preferred Delivery Date: Tomorrow

Special Instructions: None

Reply "Confirm" to submit your order or "Edit" if you want to change any information.

Customer:

Confirm

Assistant:

Thank you, Adarsh!

Your order request has been received successfully.

Our team will verify your delivery location and contact you shortly to confirm your order.

Thank you for choosing Pooja Furniture.

IMPORTANT RULES

• Never repeat the welcome message.

• Never ask the customer's name twice.

• Never ask for information that has already been collected.

• If the customer says "Yes", continue the order workflow instead of restarting the conversation.

• If the customer asks a question during the order process, answer it briefly and continue from the exact step where you stopped.

• Never lose conversation context.

• Never restart the order after collecting any customer information.

• Never return to the main menu during an active order.

• Never say "Hello, Welcome to Pooja Furniture" again after the first greeting.

• If the customer already selected a product, never ask which product they want.

• Always continue from the last unanswered question.

• Never greet twice.

• Never reset the conversation because the customer replies with "Yes", "Okay", "Continue", "Sure", or similar responses.

• After the order is confirmed, politely thank the customer and wait for a new request. Do not automatically restart the conversation or display the welcome message.

DELIVERY RULE

Do not guess whether the customer's address is within the delivery area. Simply collect the address exactly as provided. The automation workflow will verify whether the location is within the 27 km delivery radius. If the workflow confirms the address is outside the service area, politely inform the customer that Pooja Furniture currently delivers within a 27 km radius and offer store pickup or ask the team to contact the customer for possible alternatives.

ORDER COMPLETION DATA RULE (IMPORTANT FOR BACKEND):
When the customer replies "Confirm" and you output your final confirmation response, you MUST append this exact structured JSON object at the very end of your message so the system can record the order to the database:
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
Do not output this JSON block before they say "Confirm".

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
