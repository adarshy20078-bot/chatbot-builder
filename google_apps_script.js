/**
 * Google Apps Script for WhatsApp Chatbot CRM and Stateless Session History.
 * 
 * INSTRUCTIONS:
 * 1. Open a Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click Save (disk icon).
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Click the cog wheel next to Select type -> Choose "Web app".
 * 7. Set:
 *    - Description: "WhatsApp Bot Webhook"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (crucial so Vercel can access it without login).
 * 8. Click "Deploy". Authorize permissions if prompted.
 * 9. Copy the "Web app URL" and add it to your Vercel Environment Variables as GOOGLE_SHEETS_URL.
 */
// CONFIGURATION: If you created a standalone script at script.google.com, paste your Google Sheet URL below.
// If you opened Extensions -> Apps Script inside your sheet, you can leave this blank!
const GOOGLE_SHEET_URL = ""; 

function getSpreadsheet() {
  if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL !== "") {
    try {
      return SpreadsheetApp.openByUrl(GOOGLE_SHEET_URL);
    } catch (e) {
      Logger.log("Failed to open spreadsheet by URL: " + e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// POST requests: Save leads or append message history
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var doc = getSpreadsheet();
    if (!doc) {
      throw new Error("Could not access Google Sheet. If you created a standalone script on script.google.com, please paste your Google Sheet URL in the GOOGLE_SHEET_URL variable at the top of the code!");
    }
    
    // Action 1: Save Lead (CRM data)
    if (data.action === "save_lead") {
      var sheet = doc.getActiveSheet(); // First/Active sheet for leads
      var timestamp = new Date();
      var formattedDate = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      
      sheet.appendRow([
        formattedDate,
        data.name || "N/A",
        data.phone || "N/A",
        data.address || "N/A",
        data.details || "N/A"
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                           .setMimeType(ContentService.MimeType.JSON);
    } 
    
    // Action 2: Save Chat History (Conversation log)
    else if (data.action === "append_history") {
      var sheet = doc.getSheetByName("ChatHistory");
      if (!sheet) {
        sheet = doc.insertSheet("ChatHistory");
        sheet.appendRow(["Timestamp", "Phone", "Role", "Content"]);
      }
      
      var timestamp = new Date();
      var formattedDate = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      
      if (data.turns && Array.isArray(data.turns)) {
        for (var i = 0; i < data.turns.length; i++) {
          sheet.appendRow([
            formattedDate,
            data.phone,
            data.turns[i].role,
            data.turns[i].content
          ]);
        }
      } else {
        sheet.appendRow([
          formattedDate,
          data.phone,
          data.role, // 'user' or 'model'
          data.content
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                           .setMimeType(ContentService.MimeType.JSON);
    } 
    
    // Action 3: Set Bot Status (active or paused)
    else if (data.action === "set_bot_status") {
      var sheet = doc.getSheetByName("BotStatus");
      if (!sheet) {
        sheet = doc.insertSheet("BotStatus");
        sheet.appendRow(["Timestamp", "Phone", "Status"]);
      }
      
      var timestamp = new Date();
      var formattedDate = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      var phone = data.phone;
      var status = data.status || "active";
      
      var dataRange = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var i = 1; i < dataRange.length; i++) {
        if (String(dataRange[i][1]) === String(phone)) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1).setValue(formattedDate);
        sheet.getRange(foundRow, 3).setValue(status);
      } else {
        sheet.appendRow([formattedDate, phone, status]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var doc = getSpreadsheet();
    if (!doc) {
      throw new Error("Could not access Google Sheet. If you created a standalone script on script.google.com, please paste your Google Sheet URL in the GOOGLE_SHEET_URL variable at the top of the code!");
    }

    // Action 1: Get list of all active chats with their last messages
    if (action === "get_active_chats") {
      var historySheet = doc.getSheetByName("ChatHistory");
      var chats = [];
      if (historySheet) {
        var data = historySheet.getDataRange().getValues();
        var tempChats = {};
        
        for (var i = data.length - 1; i >= 1; i--) {
          var num = String(data[i][1]);
          if (!tempChats[num]) {
            tempChats[num] = {
              phone: num,
              last_message: String(data[i][3]),
              last_timestamp: String(data[i][0]),
              bot_status: "active"
            };
          }
        }
        
        var statusSheet = doc.getSheetByName("BotStatus");
        if (statusSheet) {
          var statusData = statusSheet.getDataRange().getValues();
          for (var j = 1; j < statusData.length; j++) {
            var num = String(statusData[j][1]);
            if (tempChats[num]) {
              tempChats[num].bot_status = String(statusData[j][2]);
            }
          }
        }
        
        for (var key in tempChats) {
          chats.push(tempChats[key]);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", chats: chats }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // Action 2: Get list of all saved CRM leads
    if (action === "get_leads") {
      var sheet = doc.getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var leads = [];
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][1] || data[i][2]) {
          leads.push({
            timestamp: String(data[i][0]),
            name: String(data[i][1]),
            phone: String(data[i][2]),
            address: String(data[i][3]),
            details: String(data[i][4])
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", leads: leads }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // Default action: Get chat history for a specific phone number
    var phone = e.parameter.phone;
    if (!phone) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing phone number" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = doc.getSheetByName("ChatHistory");
    
    if (!sheet) {
      // Create chat history sheet if it does not exist yet
      sheet = doc.insertSheet("ChatHistory");
      sheet.appendRow(["Timestamp", "Phone", "Role", "Content"]);
    }
    
    var data = sheet.getDataRange().getValues();
    var history = [];
    
    // Scan sheet for history rows matching this phone number
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(phone)) {
        history.push({
          role: String(data[i][2]), // 'user' or 'model'
          parts: [{ text: String(data[i][3]) }]
        });
      }
    }
    
    // Limit to last 12 messages (6 turns) to keep LLM context clean and cost-efficient
    var limit = 12;
    if (history.length > limit) {
      history = history.slice(history.length - limit);
    }
    
    // Check if the bot is paused for this phone number
    var botStatus = "active";
    var statusSheet = doc.getSheetByName("BotStatus");
    if (statusSheet) {
      var statusData = statusSheet.getDataRange().getValues();
      for (var j = 1; j < statusData.length; j++) {
        if (String(statusData[j][1]) === String(phone)) {
          botStatus = String(statusData[j][2]);
          break;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", history: history, bot_status: botStatus }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
