import { Router, Request, Response } from 'express';
import { pricingEngine, orchestrator, walletService } from '../registry';

const router = Router();

// Generate quote from slot data
router.post('/', async (req: Request, res: Response) => {
    try {
        const { serviceType, slotData } = req.body;
        const quote = pricingEngine.generateQuote(serviceType, slotData);

        // Add platform service fee (3.25%)
        const platformFee = +(quote.totalAmount * 0.0325).toFixed(2);
        quote.lineItems.push({ label: '平台服务费 (3.25%)', amount: platformFee, type: 'fee' });
        quote.totalAmount = +(quote.totalAmount + platformFee).toFixed(2);

        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate quote' });
    }
});

// Confirm quote → freeze wallet → create task → dispatch
router.post('/:id/confirm', async (req: Request, res: Response) => {
    try {
        const quoteId = req.params.id as string;
        const { userId, conversationId, serviceType, slotData, totalAmount, tip } = req.body;
        const user = userId || 'demo-user';

        const finalAmount = totalAmount + (tip || 0);

        // 1. Freeze wallet
        const freezeResult = walletService.freeze(user, finalAmount, quoteId, `${serviceType} 订单`);
        if (!freezeResult.success) {
            return res.status(400).json({ error: freezeResult.error, step: 'wallet_freeze' });
        }

        // 2. Create task
        const task = await orchestrator.createTask({
            conversationId: conversationId || quoteId,
            userId: user,
            serviceType: serviceType || 'shopping',
            slotData: slotData || {},
        });

        // 3. Update task with payment info
        task.quoteData = { quoteId, totalAmount, tip };
        task.totalAmount = finalAmount;
        task.frozenAmount = finalAmount;
        await orchestrator.updateStatus(task.id, 'payment_success', { quoteId, amount: finalAmount });

        // 4. Dispatch to Immedi (mock)
        task.immediTaskId = task.id; // use task ID as mock Immedi ID
        await orchestrator.updateStatus(task.id, 'dispatched');

        // 5. Start simulated task flow (mock)
        await orchestrator.simulateFlow(task.id);

        res.json({
            success: true,
            taskId: task.id,
            status: 'dispatched',
            frozenAmount: finalAmount,
            message: `支付成功！已冻结 S$${finalAmount.toFixed(2)}，正在安排跑腿员...`,
            wallet: walletService.getBalance(user),
        });
    } catch (error) {
        console.error('Quote confirm error:', error);
        res.status(500).json({ error: 'Failed to confirm quote' });
    }
});

export { router as quotesRouter };
