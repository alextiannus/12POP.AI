import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import * as api from '../../services/api'
import './index.scss'

interface ChatMsg {
    role: 'user' | 'ai'
    content: string
    time: string
    chips?: string[]
}

function getNow() {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const TIP_OPTIONS = [0, 2, 5, 8]
const PLATFORM_FEE_RATE = 0.033
const MIN_PLATFORM_FEE = 2.0

const QUICK_TYPES = [
    { icon: '🛒', label: '代买', desc: '超市/小贩中心/餐厅', query: '帮我代买' },
    { icon: '📋', label: '代取', desc: '文件/包裹/证件', query: '帮我代取' },
    { icon: '🕐', label: '排队', desc: '餐厅/政府/医院', query: '帮我排队' },
    { icon: '📮', label: '代寄', desc: '快递/邮件', query: '帮我代寄快递' },
    { icon: '🔧', label: '其他', desc: 'AI帮你安排', query: '' },
]

export default function Errand() {
    // Form mode vs Chat mode
    const [mode, setMode] = useState<'form' | 'chat'>('form')

    // ── Form state ──
    const [taskDesc, setTaskDesc] = useState('')
    const [pickupAddr, setPickupAddr] = useState('')
    const [deliveryAddr, setDeliveryAddr] = useState('')
    const [budget, setBudget] = useState('')
    const [deliveryFee, setDeliveryFee] = useState('')
    const [tip, setTip] = useState(0)

    // ── Chat state ──
    const [chatInput, setChatInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [showTracker, setShowTracker] = useState(false)
    const [trackerStep, setTrackerStep] = useState(0)
    const conversationIdRef = useRef<string | null>(null)
    const pollingRef = useRef<any>(null)
    const [messages, setMessages] = useState<ChatMsg[]>([
        {
            role: 'ai',
            content: '你好！我是 12Tree 🌿\n告诉我你需要什么帮助，代买代办都可以！',
            time: getNow(),
            chips: ['帮我买杯咖啡', '帮我去排队', '帮我取快递'],
        },
    ])

    // ── Computed pricing ──
    const budgetNum = parseFloat(budget) || 0
    const deliveryFeeNum = parseFloat(deliveryFee) || 0
    const subtotal = budgetNum + deliveryFeeNum
    const platformFee = Math.max(subtotal * PLATFORM_FEE_RATE, MIN_PLATFORM_FEE)
    const total = subtotal + platformFee + tip

    // ── Handlers ──
    const ensureConversation = useCallback(async () => {
        if (!conversationIdRef.current) {
            try {
                const conv = await api.createConversation('errand')
                conversationIdRef.current = conv.id
            } catch {
                conversationIdRef.current = 'local-' + Date.now()
            }
        }
        return conversationIdRef.current!
    }, [])

    useDidShow(() => {
        const pendingQuery = Taro.getStorageSync('pendingQuery')
        if (pendingQuery) {
            Taro.removeStorageSync('pendingQuery')
            setMode('chat')
            setTimeout(() => handleSendMessage(pendingQuery), 300)
        }
    })

    const handleSendMessage = async (text?: string) => {
        const msg = text || chatInput
        if (!msg.trim() || isStreaming) return
        const time = getNow()

        setMessages(prev => [...prev, { role: 'user', content: msg, time }])
        if (!text) setChatInput('')
        setIsStreaming(true)

        const convId = await ensureConversation()
        setMessages(prev => [...prev, { role: 'ai', content: '', time: getNow() }])

        api.sendMessage(convId, msg, {
            onText: (chunk) => {
                setMessages(prev => {
                    const updated = [...prev]
                    const lastAi = updated[updated.length - 1]
                    if (lastAi && lastAi.role === 'ai') lastAi.content += chunk
                    return [...updated]
                })
            },
            onSlots: () => { },
            onSlotsComplete: async (data) => {
                try {
                    const quote = await api.generateQuote(data.serviceType, data.slotData)
                    // Pre-fill form from AI chat
                    const sd = data.slotData
                    setTaskDesc(sd.item || sd.description || '')
                    setPickupAddr(sd.from || sd.pickup || '')
                    setDeliveryAddr(sd.to || sd.delivery || '')
                    if (quote.lineItems) {
                        const budgetItem = quote.lineItems.find(l => l.type === 'budget')
                        const feeItem = quote.lineItems.find(l => l.type === 'fee')
                        if (budgetItem) setBudget(String(budgetItem.amount))
                        if (feeItem) setDeliveryFee(String(feeItem.amount))
                    }
                    setTimeout(() => setMode('form'), 500)
                } catch {
                    setTimeout(() => setMode('form'), 500)
                }
            },
            onDone: () => setIsStreaming(false),
            onError: () => {
                setMessages(prev => {
                    const updated = [...prev]
                    const lastAi = updated[updated.length - 1]
                    if (lastAi && lastAi.role === 'ai' && !lastAi.content) {
                        lastAi.content = `好的，我帮你安排！\n\n请切换到表单填写详细信息和预算。`
                    }
                    return [...updated]
                })
                setIsStreaming(false)
            },
        })
    }

    const handleSubmitOrder = () => {
        if (!taskDesc.trim()) {
            Taro.showToast({ title: '请描述你的需求', icon: 'none' }); return
        }
        if (budgetNum <= 0 && deliveryFeeNum <= 0) {
            Taro.showToast({ title: '请填写预算或跑腿费', icon: 'none' }); return
        }

        Taro.showModal({
            title: '确认下单',
            content: `总计 S$${total.toFixed(2)}\n（花费预算 S$${budgetNum.toFixed(2)} + 跑腿费 S$${deliveryFeeNum.toFixed(2)} + 服务费 S$${platformFee.toFixed(2)}${tip > 0 ? ` + 小费 S$${tip.toFixed(2)}` : ''}）`,
            confirmText: '确认支付',
            confirmColor: '#6B2FE0',
            success: async (res) => {
                if (res.confirm) {
                    setShowTracker(true)
                    setTrackerStep(0)
                    // Mock tracker steps
                    const delays = [2000, 5000, 9000, 14000]
                    delays.forEach((delay, i) => {
                        setTimeout(() => setTrackerStep(i + 1), delay)
                    })
                    Taro.showToast({ title: '下单成功！', icon: 'success' })
                }
            },
        })
    }

    const goHome = () => {
        Taro.navigateBack({ delta: 1 }).catch(() => Taro.switchTab({ url: '/pages/home/index' }))
    }

    return (
        <View className='errand'>
            {/* Header */}
            <View className='errand-header'>
                <View className='status-bar' />
                <View className='header-top'>
                    <View className='back-btn' onClick={goHome}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='header-title'>代办下单</Text>
                    <View className='mode-toggle' onClick={() => setMode(mode === 'form' ? 'chat' : 'form')}>
                        <Text className='mode-toggle-text'>{mode === 'form' ? '💬 AI对话' : '📝 表单'}</Text>
                    </View>
                </View>
            </View>

            {/* ── Form Mode ── */}
            {mode === 'form' && (
                <ScrollView scrollY className='form-body'>
                    {/* Quick Type Chips */}
                    <View className='quick-types'>
                        {QUICK_TYPES.map((t, i) => (
                            <View className='quick-type-card' key={i} onClick={() => {
                                if (t.query) {
                                    setMode('chat')
                                    setTimeout(() => handleSendMessage(t.query), 300)
                                } else {
                                    setMode('chat')
                                }
                            }}>
                                <Text className='qt-icon'>{t.icon}</Text>
                                <Text className='qt-label'>{t.label}</Text>
                                <Text className='qt-desc'>{t.desc}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Task Description */}
                    <View className='form-card'>
                        <Text className='fc-label'>📝 需求描述</Text>
                        <Textarea
                            className='fc-textarea'
                            placeholder='描述你需要什么帮助，如："帮我去Clementi的NTUC买2瓶牛奶和一箱鸡蛋"'
                            placeholderClass='fc-placeholder'
                            value={taskDesc}
                            onInput={(e) => setTaskDesc(e.detail.value)}
                            maxlength={300}
                        />
                    </View>

                    {/* Addresses */}
                    <View className='form-card'>
                        <Text className='fc-label'>📍 地址</Text>
                        <View className='addr-row'>
                            <View className='addr-dot addr-dot-a' />
                            <Input
                                className='addr-input'
                                placeholder='取货/办事地址'
                                placeholderClass='fc-placeholder'
                                value={pickupAddr}
                                onInput={(e) => setPickupAddr(e.detail.value)}
                            />
                        </View>
                        <View className='addr-divider' />
                        <View className='addr-row'>
                            <View className='addr-dot addr-dot-b' />
                            <Input
                                className='addr-input'
                                placeholder='送达地址（选填）'
                                placeholderClass='fc-placeholder'
                                value={deliveryAddr}
                                onInput={(e) => setDeliveryAddr(e.detail.value)}
                            />
                        </View>
                    </View>

                    {/* Pricing */}
                    <View className='form-card'>
                        <Text className='fc-label'>💰 费用预算</Text>

                        <View className='price-field'>
                            <View className='pf-left'>
                                <Text className='pf-name'>花费预算</Text>
                                <Text className='pf-hint'>商品/服务本身费用</Text>
                            </View>
                            <View className='pf-input-wrap'>
                                <Text className='pf-prefix'>S$</Text>
                                <Input
                                    className='pf-input'
                                    type='digit'
                                    placeholder='0.00'
                                    placeholderClass='fc-placeholder'
                                    value={budget}
                                    onInput={(e) => setBudget(e.detail.value)}
                                />
                            </View>
                        </View>

                        <View className='price-field'>
                            <View className='pf-left'>
                                <Text className='pf-name'>跑腿费</Text>
                                <Text className='pf-hint'>支付给跑腿员的费用</Text>
                            </View>
                            <View className='pf-input-wrap'>
                                <Text className='pf-prefix'>S$</Text>
                                <Input
                                    className='pf-input'
                                    type='digit'
                                    placeholder='0.00'
                                    placeholderClass='fc-placeholder'
                                    value={deliveryFee}
                                    onInput={(e) => setDeliveryFee(e.detail.value)}
                                />
                            </View>
                        </View>

                        <View className='fee-auto'>
                            <Text className='fee-auto-label'>🏢 平台服务费（3.3%，最低S$2）</Text>
                            <Text className='fee-auto-value'>S${platformFee.toFixed(2)}</Text>
                        </View>

                        {/* Tip */}
                        <View className='tip-section'>
                            <Text className='tip-title'>🎁 小费（可选）</Text>
                            <Text className='tip-hint'>加小费有助于更快接单</Text>
                            <View className='tip-options'>
                                {TIP_OPTIONS.map(t => (
                                    <View
                                        key={t}
                                        className={`tip-chip ${tip === t ? 'tip-active' : ''}`}
                                        onClick={() => setTip(t)}
                                    >
                                        <Text className='tip-text'>{t === 0 ? '不加' : `S$${t}`}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View className='price-divider' />

                        {/* Total */}
                        <View className='total-row'>
                            <Text className='total-label'>合计</Text>
                            <Text className='total-value'>S${total.toFixed(2)}</Text>
                        </View>
                        <View className='total-breakdown'>
                            <Text className='tb-text'>
                                预算 ${budgetNum.toFixed(2)} + 跑腿费 ${deliveryFeeNum.toFixed(2)} + 服务费 ${platformFee.toFixed(2)}{tip > 0 ? ` + 小费 $${tip.toFixed(2)}` : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Submit */}
                    <View className='submit-btn' onClick={handleSubmitOrder}>
                        <Text className='submit-text'>确认下单 · S${total.toFixed(2)}</Text>
                    </View>

                    {/* Tracker */}
                    {showTracker && (
                        <View className='tracker-card'>
                            <Text className='tracker-title'>📦 实时状态追踪</Text>
                            {[
                                { name: '订单已确认', desc: `${getNow()} · 已冻结 S$${total.toFixed(2)}` },
                                { name: '跑腿员已接单', desc: '小明 ⭐4.9 · 距你 800m' },
                                { name: '执行中', desc: '跑腿员正在处理你的需求' },
                                { name: '已完成', desc: '实际消费后多退少不补' },
                            ].map((step, i) => {
                                const status = i < trackerStep ? 'done' : i === trackerStep ? 'active' : 'pending'
                                return (
                                    <View className={`step step-${status}`} key={i}>
                                        <View className={`step-dot ${status}`}>
                                            <Text>{status === 'done' ? '✓' : status === 'active' ? '●' : '○'}</Text>
                                        </View>
                                        <View className='step-content'>
                                            <Text className='step-name'>{step.name}</Text>
                                            <Text className='step-desc'>{step.desc}</Text>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    )}

                    <View style={{ height: '80px' }} />
                </ScrollView>
            )}

            {/* ── Chat Mode ── */}
            {mode === 'chat' && (
                <View className='chat-pane'>
                    <View className='agent-strip'>
                        <View className='agent-avatar'>
                            <Text className='agent-avatar-text'>12</Text>
                        </View>
                        <View className='agent-info'>
                            <Text className='agent-name'>12Tree 代办助手</Text>
                            <Text className='agent-status'>● 在线 · AI帮你安排一切</Text>
                        </View>
                        <View className='agent-badge' onClick={() => setMode('form')}>
                            <Text className='agent-badge-text'>📝 表单</Text>
                        </View>
                    </View>

                    <ScrollView scrollY className='chat-scroll' scrollIntoView={`msg-${messages.length - 1}`}>
                        <View className='chat-messages'>
                            {messages.map((msg, i) => (
                                <View className={`msg ${msg.role}`} key={i} id={`msg-${i}`}>
                                    {msg.role === 'ai' && (
                                        <View className='msg-avatar'>
                                            <Text className='msg-avatar-text'>12</Text>
                                        </View>
                                    )}
                                    <View className='msg-group'>
                                        <View className='msg-bubble'>{msg.content}</View>
                                        {msg.chips && (
                                            <View className='msg-chips'>
                                                {msg.chips.map((chip, j) => (
                                                    <Text className='chip-btn' key={j} onClick={() => handleSendMessage(chip)}>
                                                        {chip}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                            {isStreaming && (
                                <View className='typing'>
                                    <Text className='typing-dot'>●</Text>
                                    <Text className='typing-dot'>●</Text>
                                    <Text className='typing-dot'>●</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View className='chat-input-bar'>
                        <Input
                            className='chat-input'
                            placeholder='描述你的需求…'
                            placeholderClass='fc-placeholder'
                            value={chatInput}
                            onInput={(e) => setChatInput(e.detail.value)}
                            onConfirm={() => handleSendMessage()}
                        />
                        <View className='chat-send' onClick={() => handleSendMessage()}>
                            <Text className='chat-send-icon'>→</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
}
