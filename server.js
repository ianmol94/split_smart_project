const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB(); // ← db.js called here

app.use(express.json());

// Mount routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));

// Error middleware always last
app.use(require('./middleware/error.middleware'));

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));