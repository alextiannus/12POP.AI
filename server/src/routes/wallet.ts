import { Router, Request, Response } from 'express';
import { walletService } from '../registry';

const router = Router();

// Get wallet balance
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const balance = walletService.getBalance(req.params.userId as string);
        res.json(balance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get wallet' });
    }
});

// Get transaction history
router.get('/:userId/transactions', async (req: Request, res: Response) => {
    try {
        const txns = walletService.getTransactions(req.params.userId as string);
        res.json(txns);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// Freeze amount for a task
router.post('/freeze', async (req: Request, res: Response) => {
    try {
        const { userId, amount, taskId, description } = req.body;
        const result = walletService.freeze(userId || 'demo-user', amount, taskId, description || '订单冻结');

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        const balance = walletService.getBalance(userId || 'demo-user');
        res.json({ success: true, ...balance, message: `已冻结 S$${amount.toFixed(2)}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to freeze amount' });
    }
});

// Settle (deduct actual + refund surplus)
router.post('/settle', async (req: Request, res: Response) => {
    try {
        const { userId, frozenAmount, actualAmount, taskId, description } = req.body;
        const result = walletService.settle(
            userId || 'demo-user',
            frozenAmount,
            actualAmount,
            taskId,
            description || '订单结算'
        );
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to settle' });
    }
});

// Top up
router.post('/topup', async (req: Request, res: Response) => {
    try {
        const { userId, amount } = req.body;
        const result = walletService.topUp(userId || 'demo-user', amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to top up' });
    }
});

export { router as walletRouter };
