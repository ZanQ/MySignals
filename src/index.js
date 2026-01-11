const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

var httpsOptions = {
  key: fs.readFileSync('./src/certs/privkey.pem'),
  cert: fs.readFileSync('./src/certs/fullchain.pem'),
  ca: fs.readFileSync('./src/certs/chain.pem')
}

let server;

server = https.createServer(httpsOptions, app);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');

  // Create HTTPS server
  server.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });

  /*server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });*/
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
