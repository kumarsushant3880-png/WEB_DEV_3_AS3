require('dotenv').config();

const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Inventory API is running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start the server:', error.message);
  process.exit(1);
});
