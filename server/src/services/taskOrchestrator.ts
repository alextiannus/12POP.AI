import { ImmediClient } from './immediClient';

interface TaskInput {
    conversationId: string;
    userId: string;
    serviceType: string;
    slotData: Record<string, any>;
}

interface Task {
    id: string;
    conversationId: string;
    userId: string;
    serviceType: string;
    status: string;
    slotData: Record<string, any>;
    quoteData?: any;
    totalAmount?: number;
    frozenAmount?: number;
    immediTaskId?: string;
    immediStatus?: string;
    statusHistory: Array<{ status: string; timestamp: string; data?: any }>;
    createdAt: string;
    updatedAt: string;
}

export class TaskOrchestrator {
    private tasks: Map<string, Task> = new Map();
    private immediClient: ImmediClient;

    constructor() {
        this.immediClient = new ImmediClient();
    }

    async createTask(input: TaskInput): Promise<Task> {
        const task: Task = {
            id: crypto.randomUUID(),
            conversationId: input.conversationId,
            userId: input.userId,
            serviceType: input.serviceType,
            status: 'unquoted',
            slotData: input.slotData,
            statusHistory: [
                { status: 'unquoted', timestamp: new Date().toISOString() }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.tasks.set(task.id, task);
        return task;
    }

    getTask(taskId: string): Task | undefined {
        return this.tasks.get(taskId);
    }

    getUserTasks(userId: string): Task[] {
        return Array.from(this.tasks.values())
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async updateStatus(taskId: string, status: string, data?: any): Promise<Task | undefined> {
        const task = this.tasks.get(taskId);
        if (!task) return undefined;

        task.status = status;
        task.updatedAt = new Date().toISOString();
        task.statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            data,
        });

        return task;
    }

    async dispatchToImmedi(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        if (task.status !== 'payment_success') throw new Error('Payment not confirmed');

        try {
            const immediTaskId = await this.immediClient.dispatch(task);
            task.immediTaskId = immediTaskId;
            await this.updateStatus(taskId, 'dispatched');
            console.log(`📤 Task ${taskId} dispatched to Immedi as ${immediTaskId}`);
        } catch (error) {
            console.error(`Failed to dispatch task ${taskId}:`, error);
            throw error;
        }
    }

    async handleWebhook(immediTaskId: string, eventType: string, data: any): Promise<void> {
        // Find task by Immedi task ID
        const task = Array.from(this.tasks.values()).find(t => t.immediTaskId === immediTaskId);
        if (!task) {
            console.warn(`No task found for Immedi ID: ${immediTaskId}`);
            return;
        }

        const statusMap: Record<string, string> = {
            'task.assigned': 'assigned',
            'task.arrived': 'arrived',
            'task.picked_up': 'picked_up',
            'task.completed': 'completed',
            'task.exception': 'exception',
        };

        const newStatus = statusMap[eventType] || eventType;
        task.immediStatus = eventType;
        await this.updateStatus(task.id, newStatus, data);

        console.log(`📡 Task ${task.id} updated: ${eventType}`);

        // Handle completion
        if (eventType === 'task.completed') {
            task.status = 'completed';
            // TODO: trigger wallet settlement (deduct actual, refund surplus)
        }
    }

    // Simulate the full task flow for demo purposes
    async simulateFlow(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) return;

        // Auto-progress through statuses for demo
        const events = [
            { event: 'task.assigned', delay: 3000, data: { runner: { name: '小明', rating: 4.9, distance: '800m' } } },
            { event: 'task.arrived', delay: 8000, data: { location: task.slotData.shopName || '取货地点' } },
            { event: 'task.picked_up', delay: 15000, data: { items: task.slotData.items } },
            { event: 'task.completed', delay: 25000, data: { receipt: 'mock-receipt.jpg', actualCost: task.totalAmount ? task.totalAmount * 0.9 : 10 } },
        ];

        for (const step of events) {
            setTimeout(() => {
                this.handleWebhook(task.immediTaskId || task.id, step.event, step.data);
            }, step.delay);
        }
    }
}
