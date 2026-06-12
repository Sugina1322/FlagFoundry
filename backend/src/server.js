const http = require('http');
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { port, frontendOrigin } = require('./config');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const adminRoutes = require('./routes/admin');
const { attachTerminal } = require('./terminal');

const app = express();

app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
attachTerminal(server);

server.listen(port, () => {
  console.log(`FlagFoundry API listening on http://localhost:${port}`);
});
