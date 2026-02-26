import { Router, Request, Response } from 'express';
import { orchestrator } from '../registry';

const router = Router();

// Create task from completed slot filling
router.post('/', async (req: Request, res: Response) => {
    try {
        const { conversationId, userId, serviceType, slotData } = req.body;
        const task = await orchestrator.createTask({
            conversationId,
            userId: userId || 'demo-user',
            serviceType,
            slotData,
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Get task status
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const task = orchestrator.getTask(req.params.id as string);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get task' });
    }
});

// Get tasks for user (order history)
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const tasks = orchestrator.getUserTasks(req.params.userId as string);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

export { router as tasksRouter };
