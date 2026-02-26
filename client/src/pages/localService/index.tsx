import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
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

const SERVICE_TYPES = [
    { icon: '🧹', label: '家庭清洁', query: '需要预约上门清洁服务', desc: '深度保洁·日常清扫' },
    { icon: '🔧', label: '维修安装', query: '需要上门维修安装服务', desc: '水电维修·家具组装' },
    { icon: '📦', label: '搬家服务', query: '需要搬家服务', desc: '同城搬运·长途搬家' },
    { icon: '🐾', label: '宠物服务', query: '需要上门宠物服务', desc: '上门喂养·宠物美容' },
    { icon: '👶', label: '育儿陪护', query: '需要育儿陪护服务', desc: '月嫂保姆·陪读托管' },
    { icon: '💆', label: '美容美发', query: '需要上门美容美发', desc: '上门造型·SPA按摩' },
]

export default function LocalService() {
    const router = useRouter()
    const [mode, setMode] = useState<'form' | 'chat'>((router.params?.mode as any) === 'chat' ? 'chat' : 'form')

    // Form
    const [taskDesc, setTaskDesc] = useState('')
    const [serviceAddr, setServiceAddr] = useState('')
    const [budget, setBudget] = useState('')
    const [deliveryFee, setDeliveryFee] = useState('')
    const [tip, setTip] = useState(0)

    // Chat
    const [chatInput, setChatInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const conversationIdRef = useRef<string | null>(null)
    const [messages, setMessages] = useState<ChatMsg[]>([
        {
            role: 'ai',
            content: '你好！我是 12Tree 🌿\n需要什么上门服务？清洁、维修、搬家、宠物、育儿、美容都可以帮你安排！',
            time: getNow(),
            chips: ['预约家庭清洁', '上门维修水电', '搬家服务询价'],
        },
    ])

    // Pricing
    const budgetNum = parseFloat(budget) || 0
    const deliveryFeeNum = parseFloat(deliveryFee) || 0
    const subtotal = budgetNum + deliveryFeeNum
    const platformFee = Math.max(subtotal * PLATFORM_FEE_RATE, MIN_PLATFORM_FEE)
    const total = subtotal + platformFee + tip

    const ensureConversation = useCallback(async () => {
        if (!conversationIdRef.current) {
            try {
                const conv = await api.createConversation('onsite')
                conversationIdRef.current = conv.id
            } catch {
                conversationIdRef.current = 'local-' + Date.now()
            }
        }
        return conversationIdRef.current!
    }, [])

    const handleSendMessage = async (text?: string) => {
        const msg = text || chatInput
        if (!msg.trim() || isStreaming) return
        setMessages(prev => [...prev, { role: 'user', content: msg, time: getNow() }])
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
                    const sd = data.slotData
                    setTaskDesc(sd.description || sd.item || '')
                    setServiceAddr(sd.address || sd.location || '')
                    if (quote.lineItems) {
                        const b = quote.lineItems.find(l => l.type === 'budget')
                        const f = quote.lineItems.find(l => l.type === 'fee')
                        if (b) setBudget(String(b.amount))
                        if (f) setDeliveryFee(String(f.amount))
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
                        lastAi.content = `好的，我帮你安排上门服务！\n请切换到表单填写详细信息和预算。`
                    }
                    return [...updated]
                })
                setIsStreaming(false)
            },
        })
    }

    const handleSubmitOrder = () => {
        if (!taskDesc.trim()) {
            Taro.showToast({ title: '请描述你需要的服务', icon: 'none' }); return
        }
        if (budgetNum <= 0) {
            Taro.showToast({ title: '请填写服务预算', icon: 'none' }); return
        }

        Taro.showModal({
            title: '确认预约',
            content: `总计 S$${total.toFixed(2)}\n（服务预算 S$${budgetNum.toFixed(2)} + 上门费 S$${deliveryFeeNum.toFixed(2)} + 服务费 S$${platformFee.toFixed(2)}${tip > 0 ? ` + 小费 S$${tip.toFixed(2)}` : ''}）`,
            confirmText: '确认支付',
            confirmColor: '#6B2FE0',
            success: (res) => {
                if (res.confirm) {
                    Taro.showToast({ title: '预约成功！', icon: 'success' })
                }
            },
        })
    }

    return (
        <View className='ls-page'>
            {/* Header */}
            <View className='ls-header'>
                <View className='status-bar' />
                <View className='ls-header-row'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='ls-title'>上门服务</Text>
                    <View className='mode-toggle' onClick={() => setMode(mode === 'form' ? 'chat' : 'form')}>
                        <Text className='mode-toggle-text'>{mode === 'form' ? '💬 AI对话' : '📝 表单'}</Text>
                    </View>
                </View>
            </View>

            {/* ── Form Mode ── */}
            {mode === 'form' && (
                <ScrollView scrollY className='ls-body'>
                    {/* Service Type Cards */}
                    <View className='svc-grid'>
                        {SERVICE_TYPES.map((svc, i) => (
                            <View className='svc-card' key={i} onClick={() => {
                                setMode('chat')
                                setTimeout(() => handleSendMessage(svc.query), 300)
                            }}>
                                <Text className='svc-icon'>{svc.icon}</Text>
                                <Text className='svc-label'>{svc.label}</Text>
                                <Text className='svc-desc'>{svc.desc}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Service Description */}
                    <View className='form-card'>
                        <Text className='fc-label'>📝 服务描述</Text>
                        <Textarea
                            className='fc-textarea'
                            placeholder='描述你需要什么上门服务，如："3房1厅深度清洁，包括厨房油烟机清洗"'
                            placeholderClass='fc-placeholder'
                            value={taskDesc}
                            onInput={(e) => setTaskDesc(e.detail.value)}
                            maxlength={300}
                        />
                    </View>

                    {/* Service Address */}
                    <View className='form-card'>
                        <Text className='fc-label'>📍 服务地址</Text>
                        <Input
                            className='addr-input'
                            placeholder='输入上门服务地址'
                            placeholderClass='fc-placeholder'
                            value={serviceAddr}
                            onInput={(e) => setServiceAddr(e.detail.value)}
                        />
                    </View>

                    {/* Pricing */}
                    <View className='form-card'>
                        <Text className='fc-label'>💰 费用预算</Text>

                        <View className='price-field'>
                            <View className='pf-left'>
                                <Text className='pf-name'>服务预算</Text>
                                <Text className='pf-hint'>服务本身的费用</Text>
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
                                <Text className='pf-name'>上门费</Text>
                                <Text className='pf-hint'>出行交通及上门费</Text>
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
                            <Text className='tip-hint'>小费有助于吸引优质服务者</Text>
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

                        <View className='total-row'>
                            <Text className='total-label'>合计</Text>
                            <Text className='total-value'>S${total.toFixed(2)}</Text>
                        </View>
                        <View className='total-breakdown'>
                            <Text className='tb-text'>
                                服务 ${budgetNum.toFixed(2)} + 上门 ${deliveryFeeNum.toFixed(2)} + 服务费 ${platformFee.toFixed(2)}{tip > 0 ? ` + 小费 $${tip.toFixed(2)}` : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Submit */}
                    <View className='submit-btn' onClick={handleSubmitOrder}>
                        <Text className='submit-text'>确认预约 · S${total.toFixed(2)}</Text>
                    </View>

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
                            <Text className='agent-name'>12Tree 上门服务助手</Text>
                            <Text className='agent-status'>● 在线 · AI帮你预约</Text>
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
                            placeholder='描述你需要的上门服务…'
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
