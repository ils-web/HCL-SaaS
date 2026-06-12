const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/auth');
const taskRoutes = require('./src/routes/tasks');
const uploadRoutes = require('./src/routes/upload');
const tenantRoutes = require('./src/routes/tenants');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tenants', tenantRoutes);

// Basic healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HCL SaaS Backend is running' });
});

// Start Background Cron Jobs
const startCronJobs = require('./src/cron/cleanPhotos');
startCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
