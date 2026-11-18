const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins.includes('*') ? true : env.corsOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/objectives', require('./routes/objectives.routes'));
app.use('/api/accounts', require('./routes/accounts.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/transactions', require('./routes/transactions.routes'));
app.use('/api/balances', require('./routes/balances.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/imports', require('./routes/imports.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
