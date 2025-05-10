const express = require('express');
const runCheckins = require('./checkin');
const app = express();

app.use(express.json());

app.post('/checkin', async (req, res) => {
  try {
    await runCheckins();
    res.send('✅ All check-ins complete!');
  } catch (e) {
    res.status(500).send('❌ Check-in error: ' + e.message);
  }
});

app.listen(3000, () => {
  console.log('🚀 LivU Check-In Server running at http://localhost:3000');
});
