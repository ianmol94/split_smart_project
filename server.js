require('dotenv').config({ quiet: true });

const express = require('express');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Split Smart API is running' });
});

// Mount routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));

// 404 handler for unmatched routes
app.use(notFound);

// Central error handler - always last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));