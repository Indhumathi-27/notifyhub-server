// =============================
// NotifyHub Server - Full Code
// =============================

const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(bodyParser.json());

// =============================
// DATABASE (Render Compatible)
// =============================
const DB_PATH = path.join("/tmp", "notifyhub.db");   // FIXED SQLITE PATH

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("DB ERROR:", err);
    } else {
        console.log("SQLite connected →", DB_PATH);
    }
});

// Create table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        secret TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// =============================
// HEALTH CHECK
// =============================
app.get("/", (req, res) => {
    res.send("NotifyHub Server is Running 🚀");
});

// =============================
// CREATE NEW WEBHOOK
// =============================
app.post("/create-webhook", (req, res) => {
    const { name, secret } = req.body;

    if (!name || !secret) {
        return res.status(400).json({ error: "Name and secret required" });
    }

    db.run(
        "INSERT INTO webhooks (name, secret) VALUES (?, ?)",
        [name, secret],
        function (err) {
            if (err) return res.status(500).json({ error: "Database error" });

            res.json({
                success: true,
                id: this.lastID,
                message: "Webhook created successfully"
            });
        }
    );
});

// =============================
// RECEIVE & SEND NOTIFICATION TO ZOHO CLIQ
// =============================
app.post("/notify", (req, res) => {
    const { channel, message, secret } = req.body;

    if (!channel || !message || !secret) {
        return res.status(400).json({ error: "channel, message, secret required" });
    }

    // Zoho Cliq BOT OUTGOING MESSAGE FORMAT
    const reply = {
        text: `🔔 *NotifyHub Alert*\n${message}`
    };

    res.json(reply);  // Cliq will display this message
});

// =============================
// SERVER START
// =============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`NotifyHub server listening on ${PORT}`);
});
