const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

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
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    timeout: 60000,
  },
  qrTimeoutMs: 45000,
  takeoverOnConflict: true,
  restartOnAuthFail: true,
});

// Add debug logging
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("QR Generated - Scan with WhatsApp");
});

client.on("ready", () => {
  console.log("Bot Ready! Check groups");
});

// Add connection state monitoring
client.on("authenticated", () => console.log("Authenticated!"));
client.on("auth_failure", () => console.log("Auth Failed!"));
client.on("disconnected", (reason) => console.log("Disconnected:", reason));

client.on("message", async (msg) => {
  // Debug: Log all received messages
  console.log(`Received message from ${msg.from}: ${msg.body}`);

  console.log("Message:", msg);

  // Manual group detection
  const isGroup = msg.from.endsWith("@g.us"); // Check if message is from a group

  if (msg.body.toLowerCase().trim() === ".tagall" && isGroup) {
    console.log(`Tagall command received in group: ${msg.from}`);

    try {
      const chat = await msg.getChat();

      // Manual group verification
      const isGroupChat = chat.id.server === "g.us"; // Check if chat ID ends with @g.us

      if (isGroupChat) {
        console.log(`Processing group: ${chat.name}`);

        // Refresh group info to get latest participants
          await chat.refreshInfo();
          
          
        const participants = chat.participants;

        // Filter out the bot itself from mentions
        const botNumber = client.info.wid.user;
        const mentions = participants
          .filter((participant) => participant.id.user !== botNumber)
          .map((participant) => participant.id);

        console.log(`Attempting to tag ${mentions.length} members`);

        // Add delay if needed (for large groups)
        // await new Promise(resolve => setTimeout(resolve, 2000));

        // Send message with mentions
        await chat.sendMessage("📢 Attention Everyone!", {
          mentions: mentions,
          sendSeen: true, // Ensure message visibility
        });

        console.log("Mentions sent successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      // Send error notification to user
      msg.reply(`Failed to tag members: ${error.message}`);
    }
  }
});

// Modified initialization with retry
const initializeWithRetry = async (attempt = 1) => {
  client.initialize().catch(async (error) => {
    console.error(`Initialization failed (attempt ${attempt}):`, error);

    // Retry initialization after 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));
    initializeWithRetry(attempt + 1);
  });
};
initializeWithRetry();

// Clean exit handling
process.on("SIGINT", async () => {
    /* ... */
});
