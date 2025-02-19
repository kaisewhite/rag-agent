import express from 'express';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import crawlerRoutes from './routes/crawler/index.js';
import queryRoutes from './routes/query/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Documentation Crawler and RAG API',
            version: '1.0.0',
            description: 'API for crawling documentation and querying with RAG',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Local Development Server',
            },
            {
                url: `https://${process.env.HOST_HEADER}`,
                description: 'Production Server',
            }
        ],
        tags: [
            {
                name: 'Crawler',
                description: 'Documentation crawler endpoints'
            },
            {
                name: 'Query',
                description: 'Documentation query endpoints using RAG'
            }
        ]
    },
    apis: ['./routes/**/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI configuration
const swaggerUIOptions = {
    swaggerOptions: {
        deepLinking: true,
        defaultModelExpandDepth: 3,
        defaultModelsExpandDepth: 3,
        explorer: true,
        validatorUrl: false,
        filter: true,
        docExpansion: "none",
        tagsSorter: "alpha",
        tryItOutEnabled: true,
        displayRequestDuration: true,
    },
};

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUIOptions));

// Health check endpoint
app.get('/healthcheck', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        service: 'audit-the-audit-api-svc',
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Routes
app.use('/v1/crawler', crawlerRoutes);
app.use('/v1/query', queryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});
