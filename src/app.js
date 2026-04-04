const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Data Processing and Access Control API',
      version: '1.0.0',
      description: 'API for managing financial records with role-based access control',
    },
    servers: [
      {
        url: 'https://finance-data-processing-and-access-7hr4.onrender.com',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/records', recordRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled exception', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
