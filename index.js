const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const db = new sqlite3.Database(process.env.DB_PATH || './data/notifyhub.db');
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, name TEXT, channel TEXT, created_at INTEGER)');
  db.run('CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, webhook_id TEXT, title TEXT, message TEXT, status TEXT, created_at INTEGER)');
});

app.post('/api/create-webhook', (req,res) => {
  const name = req.body.name || 'default';
  const channel = req.body.channel || 'general';
  const id = 'wh_' + Date.now();
  db.run('INSERT INTO webhooks (id,name,channel,created_at) VALUES (?,?,?,?)', [id,name,channel,Date.now()]);
  res.json({id, url: (process.env.PUBLIC_HOST || '') + '/incoming/' + id});
});

app.post('/incoming/:id', async (req,res) => {
  const id = req.params.id;
  db.get('SELECT * FROM webhooks WHERE id=?', [id], (err,row) => {
    if(err || !row) return res.status(404).json({error:'webhook not found'});
    const title = req.body.title || 'Event';
    const message = req.body.message || JSON.stringify(req.body).slice(0,500);
    const nid = 'n_' + Date.now();
    db.run('INSERT INTO notifications (id,webhook_id,title,message,status,created_at) VALUES (?,?,?,?,?,?)',[nid,id,title,message,'new',Date.now()]);
    // Send to Cliq: requires BOT_OAUTH_TOKEN and channel mapping, not included automatically
    res.json({status:'delivered', id:nid});
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('NotifyHub server listening on ' + PORT));
