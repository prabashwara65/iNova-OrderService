const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/db/database');
const orderRoutes = require('./src/routes/orderRoutes');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'iNova Order Service',
    version: '1.0.0',
    endpoints: {
      orders: '/api/orders',
      health: '/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log('iNova Order Service');
  console.log(`Port: ${PORT}`);
  console.log(`API: http://0.0.0.0:${PORT}/api/orders`);
});
