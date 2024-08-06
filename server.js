const express = require('express');
const bodyParser = require('body-parser');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE transactions (id INTEGER PRIMARY KEY, ussd TEXT, response TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// Configure serial port
const port = new SerialPort('COM3', { baudRate: 115200 });
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

parser.on('data', data => {
  console.log('Received:', data);
});

// Send USSD command
app.post('/send-ussd', (req, res) => {
  const { ussd } = req.body;

  port.write(`AT+CUSD=1,"${ussd}",15\r`, (err) => {
    if (err) {
      console.error('Error on write:', err.message);
      return res.status(500).send({ error: 'USSD execution failed' });
    }

    parser.once('data', response => {
      // Save transaction to the database
      db.run("INSERT INTO transactions (ussd, response) VALUES (?, ?)", [ussd, response], function(err) {
        if (err) {
          return res.status(500).send({ error: 'Database insertion failed' });
        }

        res.send({ ussd, response });
      });
    });
  });
});

// Get transaction journal
app.get('/transactions', (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY timestamp DESC", (err, rows) => {
    if (err) {
      return res.status(500).send({ error: 'Database query failed' });
    }

    res.send(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
