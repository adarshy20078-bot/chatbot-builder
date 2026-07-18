const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

// SYSTEM INSTRUCTIONS AND PRODUCT CATALOG
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

let qrCodeData = null;
let clientReady = false;

// Initialize WhatsApp Web client with secure Puppeteer arguments for Docker
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-audio-output',
            '--disable-software-rasterizer',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-notifications',
            '--disable-offer-store-unmasked-cards',
            '--disable-popup-blocking',
            '--disable-print-preview',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-speech-api',
            '--disable-sync',
            '--hide-scrollbars',
            '--ignore-gpu-blacklist',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-experiments',
            '--no-pings',
            '--password-store=basic',
            '--use-gl=swiftshader',
            '--use-mock-keychain'
        ],
        executablePath: process.env.CHROME_PATH || null
    }
});

client.on('qr', (qr) => {
    console.log('QR Code generated. Scan now!');
    qrCodeData = qr;
});

client.on('authenticated', () => {
    console.log('WhatsApp Web Chatbot client is AUTHENTICATED successfully!');
});

client.on('ready', () => {
    console.log('WhatsApp Web Chatbot client is logged in and ready!');
    clientReady = true;
    qrCodeData = null;
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Web disconnected:', reason);
    clientReady = false;
});

client.initialize();

// Express endpoints for QR code scanning
app.get('/qr', (req, res) => {
    if (clientReady) {
        return res.send('<h3 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Chatbot is already logged in and active!</h3>');
    }
    if (!qrCodeData) {
        return res.send('<h3 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Generating QR Code, please wait and refresh in 5 seconds...</h3>');
    }
    qrcode.toDataURL(qrCodeData, (err, url) => {
        if (err) {
            return res.status(500).send('Error generating QR code image');
        }
        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                <h2>Scan this QR Code using Linked Devices on WhatsApp</h2>
                <p>Go to WhatsApp -> Settings -> Linked Devices -> Link a Device</p>
                <img src="${url}" style="border: 1px solid #ccc; padding: 10px; border-radius: 8px;"/>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">This page auto-refreshes every 10 seconds.</p>
                <script>
                    setTimeout(function() {
                        window.location.reload();
                    }, 10000);
                </script>
            </div>
        `);
    });
});

app.get('/', (req, res) => {
    if (clientReady) {
        res.send('<h3 style="font-family: sans-serif; text-align: center; margin-top: 50px; color: green;">Pooja Furniture Chatbot: ACTIVE (Running)</h3>');
    } else {
        res.send('<h3 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Pooja Furniture Chatbot Status: OFFLINE. <a href="/qr">Click here to scan QR code</a></h3>');
    }
});

// Incoming message handler
client.on('message', async (msg) => {
    // Only respond to individual chats (skip groups/status broadcasts)
    if (msg.from.endsWith('@g.us') || msg.from === 'status@broadcast') {
        return;
    }

    const from = msg.from.split('@')[0]; // Clean phone number
    const text = msg.body;

    if (!text) return;

    console.log(`Received message from ${from}: ${text}`);

    // Detect if this is an automated website order confirmation message
    const isWebsiteOrder = text.includes("I would like to place an order for the following items") || 
                           text.includes("place an order for the following items");

    if (isWebsiteOrder) {
        console.log(`Detected website order from ${from}`);
        try {
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
                saveLeadPromise = axios.post(GOOGLE_SHEETS_URL, leadJson, {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            let saveHistoryPromise = Promise.resolve();
            if (GOOGLE_SHEETS_URL) {
                saveHistoryPromise = axios.post(GOOGLE_SHEETS_URL, {
                    action: "append_history",
                    phone: from,
                    turns: [
                        { role: "user", content: text },
                        { role: "model", content: aiResponse }
                    ]
                }, {
                    headers: { 'Content-Type': 'application/json' }
                }).catch(histErr => console.error('Failed to save history:', histErr.message));
            }

            await Promise.all([
                client.sendMessage(msg.from, aiResponse),
                saveLeadPromise,
                saveHistoryPromise
            ]);

            console.log(`Successfully handled website order for ${from}`);
            return;
        } catch (err) {
            console.error('Error handling website order in bot:', err.message || err);
            return;
        }
    }

    try {
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
                console.error('Failed to fetch history:', histErr.message);
            }
        }

        // If the AI auto-reply is paused for this contact, skip response
        if (botStatus === 'paused') {
            console.log(`Auto-reply is paused for ${from}. Skipping response.`);
            return;
        }

        // Generate response from Gemini API
        let aiResponse = await getGeminiResponse(text, history);

        // Check if response contains a lead payload
        const leadRegex = /\[LEAD_DATA:\s*(\{.*?\})\s*\]/s;
        const match = aiResponse.match(leadRegex);
        let saveLeadPromise = Promise.resolve();

        if (match) {
            try {
                const leadJson = JSON.parse(match[1]);
                leadJson.action = 'save_lead';
                
                if (GOOGLE_SHEETS_URL) {
                    saveLeadPromise = axios.post(GOOGLE_SHEETS_URL, leadJson, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                aiResponse = aiResponse.replace(leadRegex, '').trim();
            } catch (jsonErr) {
                console.error('Failed to parse or save lead JSON:', jsonErr.message);
            }
        }

        // Save conversation turn back to history sheet
        let saveHistoryPromise = Promise.resolve();
        if (GOOGLE_SHEETS_URL) {
            saveHistoryPromise = axios.post(GOOGLE_SHEETS_URL, {
                action: "append_history",
                phone: from,
                turns: [
                    { role: "user", content: text },
                    { role: "model", content: aiResponse }
                ]
            }, {
                headers: { 'Content-Type': 'application/json' }
            }).catch(histErr => console.error('Failed to save history:', histErr.message));
        }

        // Send reply to user via WhatsApp Web client
        await Promise.all([
            client.sendMessage(msg.from, aiResponse),
            saveLeadPromise,
            saveHistoryPromise
        ]);

        console.log(`Sent response to ${from}: ${aiResponse}`);
    } catch (error) {
        console.error('Error handling message:', error.message || error);
    }
});

// Helper: Query Google Generative AI
async function getGeminiResponse(userInput, history) {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: BOT_SYSTEM_INSTRUCTION
        });

        // Clean and prepare history array for Gemini SDK
        let cleanHistory = [];
        if (history && Array.isArray(history)) {
            const mappedHistory = history.map(item => {
                if (item.parts && Array.isArray(item.parts)) {
                    return item;
                }
                return {
                    role: item.role,
                    parts: [{ text: item.content || '' }]
                };
            });

            let startIndex = 0;
            while (startIndex < mappedHistory.length && mappedHistory[startIndex].role !== 'user') {
                startIndex++;
            }

            let lastRole = null;
            for (let i = startIndex; i < mappedHistory.length; i++) {
                const turn = mappedHistory[i];
                if (turn.role === 'user' || turn.role === 'model') {
                    if (turn.role !== lastRole) {
                        cleanHistory.push(turn);
                        lastRole = turn.role;
                    } else {
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

app.listen(port, () => {
    console.log(`Automation server listening on port ${port}`);
});
