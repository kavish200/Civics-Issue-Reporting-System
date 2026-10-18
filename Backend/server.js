const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const config = require('./config/config');
const userRoutes = require('./routes/userRoute');
const testRoutes = require('./routes/testRoute');
const issueRoutes = require('./routes/issueRoute');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

connectDB();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, please try again later' }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users', userRoutes);
app.use('/api/test', testRoutes);
app.use('/api/issues', issueRoutes);

app.get('/', (req, res) => res.json({ message: 'Civics Admin API v1' }));

app.use(errorHandler);

app.listen(config.PORT, () => console.log(`Admin API running on port ${config.PORT}`));