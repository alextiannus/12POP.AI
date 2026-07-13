import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import * as api from '../../services/api'
import './index.scss'

interface OrderPreview {
    item: string
    from: string
    to: string
    price: string
}

interface ChatMsg {
    role: 'user' | 'ai'
    content: string
    time: string
    chips?: string[]
    orderPreview?: OrderPreview
}

function getNow() {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const PROMPT_POOL = [
    // 跑腿代买
    { text: '帮我去NTUC买2瓶牛奶送到家', icon: '🛒', label: '跑腿代买' },
    { text: '帮我买一杯益昌老街珍珠奶茶', icon: '🧋', label: '跑腿代买' },
    { text: '帮我去邮局寄一个包裹', icon: '📮', label: '跑腿代办' },
    { text: '帮我去药房买感冒药', icon: '💊', label: '跑腿代买' },
    { text: '帮我取一份文件从公司送到家', icon: '📋', label: '跑腿代取' },
    { text: '帮我排队买网红蛋糕', icon: '🎂', label: '跑腿排队' },
    // 上门服务
    { text: '预约明天下午上门清洁3房1厅', icon: '🧹', label: '上门服务' },
    { text: '家里水龙头漏水，需要上门维修', icon: '🔧', label: '上门维修' },
    { text: '需要搬家服务，从Clementi到Jurong', icon: '📦', label: '搬家服务' },
    { text: '预约上门宠物美容和洗澡', icon: '🐾', label: '宠物服务' },
    { text: '需要月嫂阿姨上门照顾宝宝', icon: '👶', label: '育儿陪护' },
    { text: '预约上门美甲和美睫服务', icon: '💅', label: '美容服务' },
    // 自取优惠
    { text: '附近有什么自取优惠的午餐？', icon: '🍜', label: '自取优惠' },
    { text: '想喝咖啡，附近有优惠吗？', icon: '☕', label: '自取优惠' },
]

function pickRandomPrompts(count: number) {
    const shuffled = [...PROMPT_POOL].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

export default function AIAssistant() {
    const [chatInput, setChatInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const conversationIdRef = useRef<string | null>(null)
    const [messages, setMessages] = useState<ChatMsg[]>([])
    const [prompts, setPrompts] = useState(() => pickRandomPrompts(3))

    const isChatting = messages.length > 0; // if we have messages, switch to chat mode

    const ensureConversation = useCallback(async () => {
        if (!conversationIdRef.current) {
            try {
                const conv = await api.createConversation()
                conversationIdRef.current = conv.id
            } catch {
                conversationIdRef.current = 'local-' + Date.now()
            }
        }
        return conversationIdRef.current!
    }, [])

    const handleSend = async (text?: string) => {
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
            onSlotsComplete: (data) => {
                // Show order preview card in chat instead of navigating away
                Taro.setStorageSync('errandTab', 1)
                Taro.setStorageSync('pendingQuote', JSON.stringify(data))
                const slots = (data as any).slotData || data
                const item = slots.item || slots.description || (data as any).serviceType || '代办服务'
                const from = slots.from || slots.pickupAddress || ''
                const to = slots.to || slots.deliveryAddress || ''
                const price = slots.estimatedPrice || slots.price || 'S$8.00 ~ S$15.00'
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: '',
                    time: getNow(),
                    orderPreview: { item, from, to, price },
                }])
            },
            onDone: () => setIsStreaming(false),
            onError: () => {
                setMessages(prev => {
                    const updated = [...prev]
                    const lastAi = updated[updated.length - 1]
                    if (lastAi && lastAi.role === 'ai' && !lastAi.content) {
                        lastAi.content = `收到！让我来帮你处理 🤖\n\n您可以更详细地告诉我：\n1. 需要什么服务？\n2. 在哪里 / 送到哪里？\n3. 预算大约多少？`
                        lastAi.chips = ['代买一杯咖啡', '同城取文件', '上门清洁']
                    }
                    return [...updated]
                })
                setIsStreaming(false)
            },
        })
    }

    const resetChat = () => {
        setMessages([])
        conversationIdRef.current = null
        setChatInput('')
    }

    const shufflePrompts = () => {
        setPrompts(pickRandomPrompts(3))
    }

    return (
        <View className='ai-page'>
            {/* Minimal Header */}
            <View className='minimal-header'>
                <Text className='header-title'>12Tree AI</Text>
                <View className='header-refresh' onClick={isChatting ? resetChat : shufflePrompts}>
                    换一换 <Text className='refresh-icon'>↻</Text>
                </View>
            </View>

            {/* Main Content Area */}
            {!isChatting ? (
                <View className='ai-landing'>
                    {/* Floating Center Robot */}
                    <View className='robot-center'>
                        <View className='robot-face'>
                            <View className='robot-logo'>
                                <Text className='robot-12'>12</Text>
                                <Text className='robot-pop'>POP</Text>
                            </View>
                            <View className='eq-bars left'>
                                <View className='bar' /><View className='bar' /><View className='bar' /><View className='bar' />
                            </View>
                            <View className='eq-bars right'>
                                <View className='bar' /><View className='bar' /><View className='bar' /><View className='bar' />
                            </View>
                        </View>
                        <Text className='robot-name'>12Tree</Text>
                        <View className='robot-shadow' />
                    </View>

                    {/* Floating Suggestion Cards */}
                    <View className='float-cards-container'>
                        {prompts.map((p, i) => (
                            <View className={`float-card card-${i + 1}`} key={p.text}>
                                <Text className='fc-title'>{p.text}</Text>
                                <View className='try-btn' onClick={() => handleSend(p.text)}>
                                    <Text className='try-icon'>{p.icon}</Text> {p.label}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <ScrollView scrollY className='chat-scroll' scrollIntoView={`msg-${messages.length - 1}`}>
                    <View className='chat-messages'>
                        {messages.map((msg, i) => (
                            <View className={`msg ${msg.role}`} key={i} id={`msg-${i}`}>
                                {msg.role === 'ai' && (
                                    <View className='msg-avatar'>
                                        <Text className='avatar-12t'>12</Text>
                                    </View>
                                )}
                                <View className='msg-group'>
                                    {msg.orderPreview ? (
                                        <View className='order-preview'>
                                            <View className='op-header'>
                                                <Text className='op-title'>📋 订单确认</Text>
                                            </View>
                                            <View className='op-body'>
                                                <View className='op-row'>
                                                    <Text className='op-label'>服务</Text>
                                                    <Text className='op-value'>{msg.orderPreview.item}</Text>
                                                </View>
                                                {msg.orderPreview.from && (
                                                    <View className='op-row'>
                                                        <Text className='op-label'>取货</Text>
                                                        <Text className='op-value'>{msg.orderPreview.from}</Text>
                                                    </View>
                                                )}
                                                {msg.orderPreview.to && (
                                                    <View className='op-row'>
                                                        <Text className='op-label'>送达</Text>
                                                        <Text className='op-value'>{msg.orderPreview.to}</Text>
                                                    </View>
                                                )}
                                                <View className='op-divider' />
                                                <View className='op-row'>
                                                    <Text className='op-label'>预估费用</Text>
                                                    <Text className='op-price'>{msg.orderPreview.price}</Text>
                                                </View>
                                            </View>
                                            <View className='op-pay-btn' onClick={() => Taro.navigateTo({ url: '/pages/errand/index' })}>
                                                <Text className='op-pay-text'>确认支付</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View>
                                            <View className='msg-bubble'>{msg.content}</View>
                                            {msg.chips && (
                                                <View className='msg-chips'>
                                                    {msg.chips.map((chip, j) => (
                                                        <Text className='chip-btn' key={j} onClick={() => handleSend(chip)}>
                                                            {chip}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                        {isStreaming && (
                            <View className='typing-indicator'>
                                <View className='dot' /><View className='dot' /><View className='dot' />
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

            {/* Input Pill */}
            <View className='input-dock'>
                <View className='input-pill'>
                    <View className='input-left-icon'>
                        <Text className='doc-icon'>📝</Text>
                    </View>
                    <Input
                      className='clean-input'
                      placeholder='给 12Tree 发送您想问的问题'
                      placeholderClass='clean-placeholder'
                      value={chatInput}
                      onInput={(e) => setChatInput(e.detail.value)}
                      onConfirm={() => handleSend()}
                    />
                    {chatInput.trim() && (
                        <View className='send-icon-btn' onClick={() => handleSend()}>
                            <Text className='send-arrow'>↑</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}
