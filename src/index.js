import express from 'express';
import { createServer as createServerHttp } from 'http';
import { createServer as createServerHttps } from 'https';
import { Server } from 'socket.io';
import fs from 'fs';

import { User } from './models/user.model.js';
import { Chat } from './models/chat.model.js';

import mongoose from 'mongoose';
import TransportServer from './lib/transport/TransportServer.js';

import dbConnect from './lib/dbConnect.js';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(path.resolve('./config.json')));

import bodyParser from 'body-parser';
import session from 'express-session';
import createMemoryStore from 'memorystore';

import { generateUID } from './lib/generateUID.js';
import { registerSignupRoutes } from './routes/signup.js';
import { registerPagerRoutes } from './routes/pager.js';
import { registerLockoutRoutes } from './routes/lockout.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerMediaRoutes } from './routes/media.js';

import path from 'path';
import logger from './lib/logger.js';

const PORT = 8149;

const app = express();
let httpServer;

if (config.mode === 'PRODUCTION') {
  httpServer = createServerHttps({
    key: fs.readFileSync(path.resolve('./private_key.pem')),
    cert: fs.readFileSync(path.resolve('./certificate.pem')),
  }, app);
}
else {
  httpServer = createServerHttp(app);
}

const io = new Server(httpServer, {
  path: '/chatserver',
  // Buffer size     1 KB   1 MB   10 MB
  maxHttpBufferSize: 1000 * 1000 * 10,
});

const MemoryStore = createMemoryStore(session);

export const transportServer = new TransportServer(io);
transportServer.initialize();

app.use(express.static(path.resolve('src/static')));
app.use(bodyParser.json());
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000,
  }),
  resave: false,
  saveUninitialized: false,
  secret: 'super secret secret'
}));

app.get('/ping', (req, res) => {
  res.send('Pong!');
});

registerAdminRoutes(app);
registerSignupRoutes(app);
registerPagerRoutes(app);
registerLockoutRoutes(app);
registerMediaRoutes(app);

httpServer.listen(PORT, () => {
  logger.info(`[SERVER] Now listening on port ${PORT}.`)
  dbConnect(config.dbUrl);
});