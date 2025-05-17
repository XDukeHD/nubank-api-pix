const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const config = require('../config/config.json');
const db = require('./models');
const routes = require('./routes');
const emailService = require('./services/emailService');
const cronService = require('./services/cronService');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/qrcodes', express.static(path.join(__dirname, '../public/qrcodes')));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

(async () => {
  try {
    const qrcodesDir = path.join(__dirname, '../public/qrcodes');
    if (!fs.existsSync(qrcodesDir)) {
      fs.mkdirSync(qrcodesDir, { recursive: true });
    }

    await db.sequelize.sync();
    console.log('Database initialized successfully.');

    emailService.startEmailCheck();
    
    cronService.startCronJobs();
    
    const PORT = config.server.port || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
  }
})();

module.exports = app;
