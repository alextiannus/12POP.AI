import { Router, Request, Response } from 'express';
import { aiService, slotService } from '../registry';

const router = Router();

// Create a new conversation
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, serviceType } = req.body;
        const conversation = {
            id: crypto.randomUUID(),
            userId: userId || 'demo-user',
            serviceType: serviceType || null,
            status: 'active',
            slotData: {},
            slotComplete: false,
            messages: [],
            createdAt: new Date().toISOString(),
        };
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Send a message and get AI response (SSE streaming)
router.post('/:id/messages', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { content } = req.body;

        // Set headers for SSE streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Process through slot filling to determine context
        const slotContext = slotService.getConversationContext(id);

        // Stream AI response
        await aiService.streamResponse(
            {
                conversationId: id,
                userMessage: content,
                serviceType: slotContext?.serviceType,
                slotData: slotContext?.slotData,
                slotMissing: slotContext?.missingFields || [],
            },
            (chunk: string) => {
                res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
            },
            (fullResponse: string) => {
                // Process slot filling from the response
                const updatedSlots = slotService.processResponse(id, content, fullResponse);
                res.write(`data: ${JSON.stringify({ type: 'slots', data: updatedSlots })}\n\n`);

                // If all slots are filled, notify client to show quote
                if (updatedSlots.isComplete) {
                    res.write(`data: ${JSON.stringify({ type: 'slots_complete', serviceType: updatedSlots.serviceType, slotData: updatedSlots.slotData })}\n\n`);
                }

                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                res.end();
            }
        );
    } catch (error) {
        console.error('Conversation error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Get conversation history
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const history = aiService.getHistory(id);
        res.json({
            id,
            messages: history,
            slotData: slotService.getConversationContext(id)?.slotData || {},
            slotComplete: slotService.getConversationContext(id)?.isComplete || false,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get conversation' });
    }
});

export { router as conversationRouter };
