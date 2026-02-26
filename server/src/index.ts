import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { conversationRouter } from './routes/conversation';
import { tasksRouter } from './routes/tasks';
import { quotesRouter } from './routes/quotes';
import { webhooksRouter } from './routes/webhooks';
import { walletRouter } from './routes/wallet';
import { favoritesRouter } from './routes/favorites';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: '12POP.AI API', version: '1.0.0' });
});

// Routes
app.use('/api/conversation', conversationRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/favorites', favoritesRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 12POP.AI API server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
