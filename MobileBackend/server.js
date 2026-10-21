const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const userRoutes = require('./routes/userRoute');
const issueRoutes = require('./routes/issueRoute');
const notificationRoutes = require('./routes/notificationRoute');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => res.json({ message: 'Civics Mobile API v1' }));

app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

// Only start the server if this file is run directly (not when required as a module)
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, config.HOST, () => {
    console.log(`Mobile API running on http://${config.HOST}:${config.PORT}`);
  });
}

module.exports = app;