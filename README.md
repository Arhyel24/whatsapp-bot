# **WhatsApp Group Tagging Bot Documentation**

## **Overview**
This bot is built using [`whatsapp-web.js`](https://wwebjs.dev/) and Puppeteer to automate interactions with WhatsApp groups. It listens for the `.tagall` command in group chats and tags all members except itself.

## **Installation & Setup**
### **1. Install Dependencies**
Ensure you have Node.js installed, then install the required packages:

```sh
npm install whatsapp-web.js qrcode-terminal
```

### **2. Set Up Your Bot**
Create a new JavaScript file (e.g., `bot.js`) and paste the provided code.

### **3. Run the Bot**
Start the bot with:

```sh
node bot.js
```

A QR code will be generated. Scan it with your WhatsApp account to authenticate.

---

## **Code Breakdown**
### **1. Importing Required Modules**
```js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
```
- `whatsapp-web.js`: Library for interacting with WhatsApp Web.
- `qrcode-terminal`: Used to generate QR codes in the terminal for authentication.

---

### **2. Initializing the WhatsApp Client**
```js
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./sessions",
    clientId: "my-bot",
  }),
  puppeteer: {
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--single-process",
    ],
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    timeout: 60000,
  },
  qrTimeoutMs: 45000,
  takeoverOnConflict: true,
  restartOnAuthFail: true,
});
```
- **`LocalAuth`**: Saves authentication data locally, preventing repeated logins.
- **`puppeteer`** options:
  - **`headless: false`** → Opens a visible browser for debugging.
  - **`args`** → Optimizations for performance.
  - **`executablePath`** → Path to Chrome for Puppeteer to use.
  - **`timeout: 60000`** → Extends timeout for slow networks.
- **`qrTimeoutMs: 45000`** → QR code expires in 45 seconds.
- **`takeoverOnConflict: true`** → Prevents session conflicts.
- **`restartOnAuthFail: true`** → Restarts the bot if authentication fails.

---

### **3. Event Listeners**
#### **QR Code Generation**
```js
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("QR Generated - Scan with WhatsApp");
});
```
- Generates a QR code when the bot starts.

#### **Client Ready**
```js
client.on("ready", () => {
  console.log("Bot Ready! Check groups");
});
```
- Logs a message when the bot is successfully connected.

#### **Authentication Monitoring**
```js
client.on("authenticated", () => console.log("Authenticated!"));
client.on("auth_failure", () => console.log("Auth Failed!"));
client.on("disconnected", (reason) => console.log("Disconnected:", reason));
```
- Logs authentication and disconnection events.

---

### **4. Message Handling**
#### **Listening for Messages**
```js
client.on("message", async (msg) => {
  console.log(`Received message from ${msg.from}: ${msg.body}`);

  const isGroup = msg.from.endsWith("@g.us"); // Check if message is from a group

  if (msg.body.toLowerCase().trim() === ".tagall" && isGroup) {
    console.log(`Tagall command received in group: ${msg.from}`);

    try {
      const chat = await msg.getChat();
      const isGroupChat = chat.id.server === "g.us"; // Confirm it's a group chat

      if (isGroupChat) {
        console.log(`Processing group: ${chat.name}`);

        await chat.refreshInfo(); // Refresh to get the latest members
        const participants = chat.participants;

        const botNumber = client.info.wid.user;
        const mentions = participants
          .filter((participant) => participant.id.user !== botNumber)
          .map((participant) => participant.id);

        console.log(`Attempting to tag ${mentions.length} members`);

        await chat.sendMessage("📢 Attention Everyone!", {
          mentions: mentions,
          sendSeen: true,
        });

        console.log("Mentions sent successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      msg.reply(`Failed to tag members: ${error.message}`);
    }
  }
});
```
- **Checks if the message is from a group** (`@g.us`).
- **Detects the `.tagall` command**.
- **Fetches group participants**.
- **Excludes the bot itself** from mentions.
- **Tags all members** in the group.

---

### **5. Initialization with Retry**
```js
const initializeWithRetry = async (attempt = 1) => {
  client.initialize().catch(async (error) => {
    console.error(`Initialization failed (attempt ${attempt}):`, error);

    await new Promise((resolve) => setTimeout(resolve, 10000));
    initializeWithRetry(attempt + 1);
  });
};
initializeWithRetry();
```
- **Retries initialization** if it fails, waiting 10 seconds between attempts.

---

### **6. Graceful Shutdown**
```js
process.on("SIGINT", async () => {
  console.log("Shutting down bot...");
  await client.destroy();
  process.exit(0);
});
```
- Ensures **clean exit** when the bot is stopped manually.
