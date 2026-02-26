import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `你是 12POP.AI 的 AI 本地生活助理，服务于新加坡华人社区。你帮助用户完成代买、跑腿、上门服务等本地生活任务。

## 你的角色
- 你是一个友好、高效的执行助手
- 用简体中文交流，可以夹杂新加坡本地用语
- 回复保持简洁，每轮最多追问 2 个字段
- 最多 5 轮对话完成信息收集

## 服务类型
1. **代买 (shopping)**: 代为购买商品并配送
2. **跑腿 (errand)**: 点对点物品递送或现场执行
3. **上门服务 (home_service)**: 安排服务人员上门
4. **其他需求 (open_request)**: 开放式需求

## Slot Filling 规则
根据服务类型收集所需字段：

### 代买 (shopping):
- shopName: 商家名称或位置
- items: 商品列表（名称+数量+规格）
- deliveryAddress: 配送地址+联系人+电话
- userBudget: 预付预算金额

### 跑腿 (errand):
- pickupAddress: 取件地址
- deliveryAddress: 送达地址
- instructions: 附加说明
- timeRequirement: 时间要求

### 上门服务 (home_service):
- serviceType: 服务类型（清洁/维修/安装/推拿等）
- address: 上门地址
- scheduledTime: 预约时间
- details: 具体需求描述
- customerContact: 联系电话

## 输出规则
1. 理解用户意图后，确认服务类型
2. 逐步收集缺失字段，每轮最多追问 2 个
3. 所有字段收齐后，输出结构化摘要让用户确认
4. 用户确认后告知正在生成报价
5. 如果需求超出能力范围，礼貌说明并引导至最近似的服务

## 重要
- 强调"不加价承诺"（平台协议保障）
- 用户必须全额预付预算，不做垫付
- 保持对话自然流畅，像朋友间聊天`;

interface ConversationInput {
    conversationId: string;
    userMessage: string;
    serviceType?: string;
    slotData?: Record<string, any>;
    slotMissing?: string[];
}

export class AIConversationService {
    private client: Anthropic | null = null;
    private conversationHistories: Map<string, Array<{ role: string; content: string }>> = new Map();

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey && apiKey !== 'your-anthropic-api-key-here') {
            this.client = new Anthropic({ apiKey });
        }
    }

    async streamResponse(
        input: ConversationInput,
        onChunk: (chunk: string) => void,
        onComplete: (fullResponse: string) => void
    ): Promise<void> {
        const history = this.getHistory(input.conversationId);
        history.push({ role: 'user', content: input.userMessage });

        // Build context with slot filling info
        let contextNote = '';
        if (input.serviceType) {
            contextNote += `\n[系统提示: 当前服务类型=${input.serviceType}]`;
        }
        if (input.slotData && Object.keys(input.slotData).length > 0) {
            contextNote += `\n[已收集信息: ${JSON.stringify(input.slotData)}]`;
        }
        if (input.slotMissing && input.slotMissing.length > 0) {
            contextNote += `\n[还需收集: ${input.slotMissing.join(', ')}]`;
        }

        if (!this.client) {
            // Mock response when no API key
            const mockResponse = this.getMockResponse(input);
            for (const char of mockResponse) {
                onChunk(char);
                await new Promise(r => setTimeout(r, 15));
            }
            history.push({ role: 'assistant', content: mockResponse });
            onComplete(mockResponse);
            return;
        }

        try {
            const messages = history.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content + (m.role === 'user' && contextNote ? contextNote : ''),
            }));

            const stream = this.client.messages.stream({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages,
            });

            let fullResponse = '';
            for await (const event of stream) {
                if (event.type === 'content_block_delta' && 'delta' in event) {
                    const delta = event.delta as any;
                    if (delta.text) {
                        fullResponse += delta.text;
                        onChunk(delta.text);
                    }
                }
            }

            history.push({ role: 'assistant', content: fullResponse });
            onComplete(fullResponse);
        } catch (error) {
            console.error('Claude API error:', error);
            const fallback = '抱歉，AI 暂时无法响应。请稍后重试，或联系人工客服。';
            onChunk(fallback);
            onComplete(fallback);
        }
    }

    getHistory(conversationId: string) {
        if (!this.conversationHistories.has(conversationId)) {
            this.conversationHistories.set(conversationId, []);
        }
        return this.conversationHistories.get(conversationId)!;
    }

    private getMockResponse(input: ConversationInput): string {
        const msg = input.userMessage;

        // First message / greeting
        if (!input.serviceType) {
            if (msg.includes('买') || msg.includes('奶茶') || msg.includes('鸡饭')) {
                return `收到！我来帮你代买 🛒\n\n确认一下：\n▸ **商品**：${msg}\n\n请告诉我：\n1. 要从哪家店买？\n2. 送到哪个地址？`;
            }
            if (msg.includes('送') || msg.includes('取') || msg.includes('文件')) {
                return `好的，跑腿服务安排上 🏃\n\n请告诉我：\n1. 取件地址（从哪里取）？\n2. 送达地址（送到哪里）？`;
            }
            if (msg.includes('清洁') || msg.includes('维修') || msg.includes('安装')) {
                return `好的，上门服务安排上 🏠\n\n请告诉我：\n1. 上门地址？\n2. 希望什么时间安排？`;
            }
            return `你好！👋 告诉我你需要什么帮助，我来搞定！\n\n我可以帮你：\n🛒 **代买** — 帮你去买东西送到家\n🏃 **跑腿** — 帮你取送物品\n🏠 **上门服务** — 清洁、维修、安装\n\n直接告诉我你的需求吧！`;
        }

        // Slot filling in progress
        if (input.slotMissing && input.slotMissing.length > 0) {
            return `收到！信息已更新 ✅\n\n还需要确认：${input.slotMissing.slice(0, 2).join(' 和 ')}`;
        }

        // All slots filled
        return `太好了！所有信息已收集完毕 ✅\n\n📋 **订单摘要**\n${JSON.stringify(input.slotData, null, 2)}\n\n正在为你生成报价...`;
    }
}
