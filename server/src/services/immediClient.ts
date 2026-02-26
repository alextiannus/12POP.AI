interface ImmediTask {
    serviceType: string;
    slotData: Record<string, any>;
}

export class ImmediClient {
    private baseUrl: string;
    private agentKey: string;
    private agentId: string;

    constructor() {
        this.baseUrl = process.env.IMMEDI_API_URL || 'http://localhost:3001/mock/immedi';
        this.agentKey = process.env.IMMEDI_AGENT_KEY || 'mock-agent-key';
        this.agentId = process.env.IMMEDI_AGENT_ID || '12pop_core_v1';
    }

    async dispatch(task: ImmediTask): Promise<string> {
        const payload = this.buildPayload(task);

        // In development: use mock
        if (this.baseUrl.includes('mock')) {
            console.log('🤖 Using mock Immedi service');
            return `mock-immedi-${crypto.randomUUID().slice(0, 8)}`;
        }

        // Production: call real Immedi API
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.agentKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Immedi API error: ${response.status}`);
            }

            const data = await response.json() as { task_id: string };
            return data.task_id;
        } catch (error) {
            console.error('Immedi dispatch failed:', error);
            throw error;
        }
    }

    private buildPayload(task: ImmediTask): Record<string, any> {
        const { serviceType, slotData } = task;

        const base = {
            agent_id: this.agentId,
            task_type: this.mapServiceType(serviceType),
        };

        switch (serviceType) {
            case 'shopping':
                return {
                    ...base,
                    payload: {
                        location: {
                            name: slotData.shopName,
                            address: slotData.shopLocation || slotData.shopName,
                        },
                        items: Array.isArray(slotData.items) ? slotData.items : [slotData.items],
                        delivery_to: {
                            address: slotData.deliveryAddress,
                            contact_name: slotData.contactName || 'User',
                            contact_phone: slotData.contactPhone || '',
                        },
                        budget_limit: slotData.userBudget || 50,
                    },
                };

            case 'errand':
                return {
                    ...base,
                    payload: {
                        pickup: { address: slotData.pickupAddress },
                        delivery: { address: slotData.deliveryAddress },
                        instructions: slotData.instructions || '',
                        time_requirement: slotData.timeRequirement || null,
                    },
                };

            default:
                return {
                    ...base,
                    payload: slotData,
                };
        }
    }

    private mapServiceType(type: string): string {
        const map: Record<string, string> = {
            shopping: 'shopping',
            errand: 'errand',
            home_service: 'reservation', // Immedi uses 'reservation' for services
            open_request: 'errand',
        };
        return map[type] || 'errand';
    }
}
