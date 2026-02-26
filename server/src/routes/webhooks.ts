import { Router, Request, Response } from 'express';
import { orchestrator, walletService } from '../registry';

const router = Router();

// Immedi AI webhook receiver
router.post('/immedi', async (req: Request, res: Response) => {
    try {
        const { task_id, event_type, data } = req.body;
        console.log(`📡 Webhook received: ${event_type} for task ${task_id}`);

        await orchestrator.handleWebhook(task_id, event_type, data);

        // On completion, settle the wallet
        if (event_type === 'task.completed') {
            const task = Array.from(orchestrator['tasks']?.values() || [])
                .find((t: any) => t.immediTaskId === task_id);
            if (task && (task as any).frozenAmount) {
                const actualCost = data?.actualCost || (task as any).frozenAmount;
                walletService.settle(
                    (task as any).userId,
                    (task as any).frozenAmount,
                    actualCost,
                    (task as any).id,
                    '订单完成结算'
                );
                console.log(`💰 Wallet settled for task ${(task as any).id}`);
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export { router as webhooksRouter };
