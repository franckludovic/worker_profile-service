require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');
const config = require('./src/config/config');

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`Worker Profile Service listening on port ${PORT}`);
});
