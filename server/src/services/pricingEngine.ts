interface QuoteLineItem {
    label: string;
    amount: number;
    type: 'item' | 'fee' | 'budget';
}

interface Quote {
    id: string;
    serviceType: string;
    lineItems: QuoteLineItem[];
    totalAmount: number;
    estimatedTime: string;
    currency: string;
    notes: string[];
}

export class PricingEngine {
    generateQuote(serviceType: string, slotData: Record<string, any>): Quote {
        const id = crypto.randomUUID();

        switch (serviceType) {
            case 'shopping':
                return this.generateShoppingQuote(id, slotData);
            case 'errand':
                return this.generateErrandQuote(id, slotData);
            case 'home_service':
                return this.generateHomeServiceQuote(id, slotData);
            default:
                return this.generateOpenRequestQuote(id, slotData);
        }
    }

    private generateShoppingQuote(id: string, slotData: Record<string, any>): Quote {
        const baseFee = 5.00;
        const distanceFee = 3.00; // TBD: calculate from actual distance
        const budget = slotData.userBudget || 15.00;

        return {
            id,
            serviceType: 'shopping',
            lineItems: [
                { label: '代买预算（预冻结）', amount: budget, type: 'budget' },
                { label: '基础服务费', amount: baseFee, type: 'fee' },
                { label: '配送费（约2km）', amount: distanceFee, type: 'fee' },
            ],
            totalAmount: budget + baseFee + distanceFee,
            estimatedTime: '约 35-50 分钟',
            currency: 'SGD',
            notes: [
                '代买预算将全额冻结，实际消费后多退少不补',
                '等待超过30分钟将产生等待费',
                '平台不加价承诺',
            ],
        };
    }

    private generateErrandQuote(id: string, slotData: Record<string, any>): Quote {
        const baseFee = 5.00;
        const distanceFee = 3.00; // TBD

        return {
            id,
            serviceType: 'errand',
            lineItems: [
                { label: '配送基础费', amount: baseFee, type: 'fee' },
                { label: '距离费（约2.3km）', amount: distanceFee, type: 'fee' },
            ],
            totalAmount: baseFee + distanceFee,
            estimatedTime: '约 30-45 分钟',
            currency: 'SGD',
            notes: [
                '超时等待、多次往返可能产生额外费用',
                '需二次确认后方可继续',
            ],
        };
    }

    private generateHomeServiceQuote(id: string, slotData: Record<string, any>): Quote {
        const serviceType = slotData.serviceType || '上门服务';
        const priceMap: Record<string, number> = {
            '上门清洁': 60,
            '家电维修': 40,
            '安装组装': 35,
            '上门推拿': 80,
        };
        const price = priceMap[serviceType] || 50;

        return {
            id,
            serviceType: 'home_service',
            lineItems: [
                { label: `${serviceType}（起步价）`, amount: price, type: 'fee' },
            ],
            totalAmount: price,
            estimatedTime: '2小时内确认服务商',
            currency: 'SGD',
            notes: [
                '最终费用以服务商确认为准',
                '支付为预授权（冻结款项），服务完成后实际扣款',
                '不满意可免费返工或退款',
            ],
        };
    }

    private generateOpenRequestQuote(id: string, slotData: Record<string, any>): Quote {
        return {
            id,
            serviceType: 'open_request',
            lineItems: [
                { label: '自定义需求服务费', amount: 15.00, type: 'fee' },
            ],
            totalAmount: 15.00,
            estimatedTime: '视需求而定',
            currency: 'SGD',
            notes: [
                '服务费按实际情况调整',
                '需运营确认可执行性',
            ],
        };
    }
}
