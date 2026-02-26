interface SlotDefinition {
    field: string;
    label: string;
    required: boolean;
}

interface ConversationSlotState {
    serviceType: string;
    slotData: Record<string, any>;
    missingFields: string[];
    isComplete: boolean;
}

const SERVICE_SLOTS: Record<string, SlotDefinition[]> = {
    shopping: [
        { field: 'shopName', label: '商家名称', required: true },
        { field: 'items', label: '商品列表', required: true },
        { field: 'deliveryAddress', label: '配送地址', required: true },
        { field: 'userBudget', label: '预付预算', required: true },
    ],
    errand: [
        { field: 'pickupAddress', label: '取件地址', required: true },
        { field: 'deliveryAddress', label: '送达地址', required: true },
        { field: 'instructions', label: '附加说明', required: false },
        { field: 'timeRequirement', label: '时间要求', required: false },
    ],
    home_service: [
        { field: 'serviceType', label: '服务类型', required: true },
        { field: 'address', label: '上门地址', required: true },
        { field: 'scheduledTime', label: '预约时间', required: true },
        { field: 'details', label: '需求描述', required: true },
        { field: 'customerContact', label: '联系电话', required: true },
    ],
    open_request: [
        { field: 'description', label: '需求描述', required: true },
        { field: 'location', label: '地点', required: false },
        { field: 'timeRequirement', label: '时间要求', required: false },
    ],
};

export class SlotFillingService {
    private states: Map<string, ConversationSlotState> = new Map();

    getConversationContext(conversationId: string): ConversationSlotState | null {
        return this.states.get(conversationId) || null;
    }

    detectServiceType(message: string): string | null {
        const lower = message.toLowerCase();
        if (lower.includes('买') || lower.includes('购') || lower.includes('奶茶') || lower.includes('鸡饭') || lower.includes('超市')) {
            return 'shopping';
        }
        if (lower.includes('送') || lower.includes('取') || lower.includes('文件') || lower.includes('包裹') || lower.includes('快递')) {
            return 'errand';
        }
        if (lower.includes('清洁') || lower.includes('维修') || lower.includes('安装') || lower.includes('按摩') || lower.includes('推拿') || lower.includes('上门')) {
            return 'home_service';
        }
        return null;
    }

    processResponse(conversationId: string, userMessage: string, aiResponse: string): ConversationSlotState {
        let state = this.states.get(conversationId);

        // Auto-detect service type from first message
        if (!state) {
            const serviceType = this.detectServiceType(userMessage) || 'open_request';
            state = {
                serviceType,
                slotData: {},
                missingFields: this.getMissingFields(serviceType, {}),
                isComplete: false,
            };
            this.states.set(conversationId, state);
        }

        // Extract slot data from user message using basic NLP
        this.extractSlots(state, userMessage);

        // Update missing fields
        state.missingFields = this.getMissingFields(state.serviceType, state.slotData);
        state.isComplete = state.missingFields.length === 0;

        return state;
    }

    private extractSlots(state: ConversationSlotState, message: string): void {
        const { serviceType, slotData } = state;

        // Basic extraction rules (in production, Claude handles this via structured output)
        if (serviceType === 'shopping') {
            // Extract shop name
            const shopPatterns = ['益昌老街', 'Maxwell', '天天', '海南鸡饭', '超市', '菜市场'];
            for (const shop of shopPatterns) {
                if (message.includes(shop)) {
                    slotData.shopName = shop;
                }
            }

            // Extract items from message
            if (!slotData.items && (message.includes('买') || message.includes('要'))) {
                slotData.items = message;
            }

            // Extract address
            const addressMatch = message.match(/送到(.+?)(?:[,，。！]|$)/);
            if (addressMatch) {
                slotData.deliveryAddress = addressMatch[1].trim();
            }

            // Extract budget
            const budgetMatch = message.match(/(\d+(?:\.\d{2})?)\s*(?:块|元|新币|SGD|\$)/i);
            if (budgetMatch) {
                slotData.userBudget = parseFloat(budgetMatch[1]);
            }
        }

        if (serviceType === 'errand') {
            const fromMatch = message.match(/从(.+?)(?:送|到|至)/);
            if (fromMatch) slotData.pickupAddress = fromMatch[1].trim();

            const toMatch = message.match(/(?:送到|到|至)(.+?)(?:[,，。！]|$)/);
            if (toMatch) slotData.deliveryAddress = toMatch[1].trim();
        }

        if (serviceType === 'home_service') {
            if (message.includes('清洁')) slotData.serviceType = '上门清洁';
            if (message.includes('维修')) slotData.serviceType = '家电维修';
            if (message.includes('安装')) slotData.serviceType = '安装组装';
            if (message.includes('按摩') || message.includes('推拿')) slotData.serviceType = '上门推拿';
        }
    }

    private getMissingFields(serviceType: string, slotData: Record<string, any>): string[] {
        const slots = SERVICE_SLOTS[serviceType] || SERVICE_SLOTS.open_request;
        return slots
            .filter(s => s.required && !slotData[s.field])
            .map(s => s.label);
    }
}
