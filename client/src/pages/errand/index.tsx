import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import * as api from '../../services/api'
import { saveOrder, generateOrderId, type Order } from '../../services/orderStore'
import './index.scss'

interface OrderPreview {
    service: string
    from: string
    to: string
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

const TIP_OPTIONS = [0, 3, 5, 8]
const PLATFORM_FEE_RATE = 0.033
const MIN_PLATFORM_FEE = 2.0

// AI prompts per tab
const AI_CONFIG = {
    errand: {
        name: '12Tree 跑腿助手',
        greeting: '你好！我是 12Tree 🌿\n告诉我你想买什么或需要什么帮助，代买代办都可以！',
        chips: ['帮我买杯咖啡', '超市采购', '帮我取快递'],
        placeholder: '告诉我你想买什么…',
    },
    onsite: {
        name: '12Tree 上门服务',
        greeting: '你好！我是 12Tree 🌿\n需要什么上门服务？清洁、维修、搬家、宠物、育儿、美容都可以帮你安排！',
        chips: ['预约家庭清洁', '上门维修水电', '搬家服务询价'],
        placeholder: '描述你需要的上门服务…',
    },
}

export default function Errand() {
    const [activeTab, setActiveTab] = useState(0)

    // ── Delivery Form State ──
    const [pickupAddr, setPickupAddr] = useState('')
    const [deliveryAddr, setDeliveryAddr] = useState('')
    const [remark, setRemark] = useState('')
    const [deliveryTip, setDeliveryTip] = useState(2)

    // ── AI Chat State (shared by tab 1 & 2) ──
    const [chatInput, setChatInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const conversationIdRef = useRef<string | null>(null)
    const userMsgCountRef = useRef(0)
    const [messages, setMessages] = useState<ChatMsg[]>([])
    const [chatType, setChatType] = useState<'errand' | 'onsite'>('errand')

    // ── Order Preview State (editable in chat) ──
    const [prevBudget, setPrevBudget] = useState('')
    const [prevFee, setPrevFee] = useState('')
    const [prevTip, setPrevTip] = useState(0)
    const prevBudgetNum = parseFloat(prevBudget) || 0
    const prevFeeNum = parseFloat(prevFee) || 0
    const prevSubtotal = prevBudgetNum + prevFeeNum
    const prevPlatformFee = Math.max(prevSubtotal * PLATFORM_FEE_RATE, MIN_PLATFORM_FEE)
    const prevTotal = prevSubtotal + prevPlatformFee + prevTip

    // Delivery pricing (配送费 will come from backend API)
    const deliveryFee = 8.00
    const deliveryPlatformFee = Math.max(deliveryFee * PLATFORM_FEE_RATE, MIN_PLATFORM_FEE)
    const deliveryTotal = deliveryFee + deliveryPlatformFee + deliveryTip

    // Initialize AI chat for a given type
    const initChat = useCallback((type: 'errand' | 'onsite') => {
        setChatType(type)
        conversationIdRef.current = null
        userMsgCountRef.current = 0
        const config = AI_CONFIG[type]
        setMessages([{
            role: 'ai',
            content: config.greeting,
            time: getNow(),
            chips: config.chips,
        }])
        setChatInput('')
    }, [])

    const switchTab = (index: number) => {
        setActiveTab(index)
        if (index === 1 && chatType !== 'errand') initChat('errand')
        if (index === 2 && chatType !== 'onsite') initChat('onsite')
        if (index === 1 && messages.length === 0) initChat('errand')
        if (index === 2 && messages.length === 0) initChat('onsite')
    }

    useDidShow(() => {
        const savedTab = Taro.getStorageSync('errandTab')
        if (savedTab !== '' && savedTab !== undefined) {
            const tabIndex = Number(savedTab)
            Taro.removeStorageSync('errandTab')
            setActiveTab(tabIndex)
            if (tabIndex === 1) initChat('errand')
            if (tabIndex === 2) initChat('onsite')
        }
        // Pending AI query
        const pendingQuery = Taro.getStorageSync('pendingQuery')
        if (pendingQuery) {
            Taro.removeStorageSync('pendingQuery')
            setActiveTab(1)
            initChat('errand')
            setTimeout(() => handleSendMessage(pendingQuery), 300)
        }
    })

    const ensureConversation = useCallback(async () => {
        if (!conversationIdRef.current) {
            try {
                const conv = await api.createConversation(chatType)
                conversationIdRef.current = conv.id
            } catch {
                conversationIdRef.current = 'local-' + Date.now()
            }
        }
        return conversationIdRef.current!
    }, [chatType])

    const handleSendMessage = async (text?: string) => {
        const msg = text || chatInput
        if (!msg.trim() || isStreaming) return

        // Handle special chip actions
        if (msg === '查看订单') { Taro.navigateTo({ url: '/pages/orders/index' }); return }
        if (msg === '返回首页') { Taro.switchTab({ url: '/pages/home/index' }); return }

        setMessages(prev => [...prev, { role: 'user', content: msg, time: getNow() }])
        if (!text) setChatInput('')
        userMsgCountRef.current += 1
        const msgCount = userMsgCountRef.current
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
                const sd = (data as any).slotData || data
                const service = sd.item || sd.description || (data as any).serviceType || '代办服务'
                const from = sd.from || sd.pickupAddress || sd.address || ''
                const to = sd.to || sd.deliveryAddress || ''
                const estBudget = sd.estimatedPrice || sd.price || sd.budget || ''
                const estFee = sd.deliveryFee || sd.fee || ''
                // Pre-fill preview state
                if (estBudget) setPrevBudget(String(parseFloat(estBudget) || ''))
                if (estFee) setPrevFee(String(parseFloat(estFee) || ''))
                setPrevTip(0)
                // Add preview card to chat
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: '',
                    time: getNow(),
                    orderPreview: { service, from, to },
                }])
            },
            onDone: () => setIsStreaming(false),
            onError: () => {
                // Demo: show order preview on 3rd message
                if (msgCount >= 3) {
                    setMessages(prev => {
                        const updated = [...prev]
                        const lastAi = updated[updated.length - 1]
                        if (lastAi && lastAi.role === 'ai' && !lastAi.content) {
                            lastAi.content = '好的，我已经整理好你的需求，请确认订单信息：'
                        }
                        return [...updated]
                    })
                    // Collect user messages to build preview
                    const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content)
                    const service = userMsgs[0] || (chatType === 'errand' ? '代买服务' : '上门服务')
                    const from = userMsgs[1] || ''
                    const to = userMsgs[2] || ''
                    setPrevBudget(chatType === 'errand' ? '15' : '80')
                    setPrevFee(chatType === 'errand' ? '5' : '10')
                    setPrevTip(0)
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            role: 'ai',
                            content: '',
                            time: getNow(),
                            orderPreview: { service, from, to },
                        }])
                    }, 300)
                    setIsStreaming(false)
                    return
                }

                // Normal mock reply for messages 1-2
                const mockReplies = chatType === 'errand'
                    ? [
                        { text: '收到！帮你代买 🛒\n\n从哪家店买呢？', chips: ['NTUC', '小贩中心', '随便你选'] },
                        { text: '好的！送到哪里呢？', chips: ['我家地址', '公司地址', 'Clementi Block 123'] },
                    ]
                    : [
                        { text: '收到！帮你安排 🏠\n\n服务地址是哪里？', chips: ['我家地址', 'Jurong West', 'Clementi'] },
                        { text: '好的！你的预算大概多少？', chips: ['预算S$50', '预算S$80', '预算S$120'] },
                    ]
                const reply = mockReplies[Math.min(msgCount - 1, mockReplies.length - 1)]

                setMessages(prev => {
                    const updated = [...prev]
                    const lastAi = updated[updated.length - 1]
                    if (lastAi && lastAi.role === 'ai' && !lastAi.content) {
                        lastAi.content = reply.text
                        lastAi.chips = reply.chips
                    }
                    return [...updated]
                })
                setIsStreaming(false)
            },
        })
    }

    const handleDeliveryConfirm = () => {
        if (!pickupAddr.trim()) {
            Taro.showToast({ title: '请输入取件地址', icon: 'none' }); return
        }
        if (!deliveryAddr.trim()) {
            Taro.showToast({ title: '请输入送达地址', icon: 'none' }); return
        }
        Taro.showModal({
            title: '确认下单',
            content: `总计 S$${deliveryTotal.toFixed(2)}\n（配送费 S$${deliveryFee.toFixed(2)} + 服务费 S$${deliveryPlatformFee.toFixed(2)}${deliveryTip > 0 ? ` + 小费 S$${deliveryTip.toFixed(2)}` : ''}）`,
            confirmText: '确认支付',
            confirmColor: '#6B2FE0',
            success: (res) => {
                if (res.confirm) {
                    Taro.showToast({ title: '下单成功！配送员正在赶来', icon: 'success' })
                }
            },
        })
    }

    const goHome = () => {
        Taro.navigateBack({ delta: 1 }).catch(() => Taro.switchTab({ url: '/pages/home/index' }))
    }

    const config = AI_CONFIG[chatType]

    return (
        <View className='errand'>
            {/* Header */}
            <View className='errand-header'>
                <View className='status-bar' />
                <View className='header-top'>
                    <View className='back-btn' onClick={goHome}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='header-title'>
                        {activeTab === 0 ? '同城配送' : activeTab === 1 ? '跑腿代买' : '上门服务'}
                    </Text>
                    <View style={{ width: '56px' }} />
                </View>
                <View className='tab-bar'>
                    {['同城配送', '跑腿（代买）', '上门服务'].map((tab, i) => (
                        <View
                            key={i}
                            className={`tab ${activeTab === i ? 'tab-active' : ''}`}
                            onClick={() => switchTab(i)}
                        >
                            <Text className={`tab-text ${activeTab === i ? 'tab-text-active' : ''}`}>{tab}</Text>
                            {activeTab === i && <View className='tab-indicator' />}
                        </View>
                    ))}
                </View>
            </View>

            {/* ═══ Tab 0: 同城配送 Form ═══ */}
            {activeTab === 0 && (
                <ScrollView scrollY className='tab-body'>
                    {/* Map Placeholder */}
                    <View className='map-area'>
                        <View className='map-bg' />
                        <View className='map-road h' style={{ top: '32%' }} />
                        <View className='map-road h' style={{ top: '65%' }} />
                        <View className='map-road v' style={{ left: '28%' }} />
                        <View className='map-road v' style={{ left: '58%' }} />
                        <View className='map-route' />
                        <View className='map-pin pin-a'><Text className='pin-label'>A</Text></View>
                        <View className='map-pin pin-b'><Text className='pin-label'>B</Text></View>
                    </View>

                    {/* Address Form */}
                    <View className='form-card'>
                        <View className='addr-row'>
                            <View className='addr-dot addr-dot-a' />
                            <View className='addr-content'>
                                <Text className='addr-label'>取件地址</Text>
                                <Input
                                    className='addr-input'
                                    placeholder='输入取件地址'
                                    placeholderClass='fc-placeholder'
                                    value={pickupAddr}
                                    onInput={(e) => setPickupAddr(e.detail.value)}
                                />
                            </View>
                        </View>
                        <View className='addr-divider' />
                        <View className='addr-row'>
                            <View className='addr-dot addr-dot-b' />
                            <View className='addr-content'>
                                <Text className='addr-label'>送达地址</Text>
                                <Input
                                    className='addr-input'
                                    placeholder='输入送达地址'
                                    placeholderClass='fc-placeholder'
                                    value={deliveryAddr}
                                    onInput={(e) => setDeliveryAddr(e.detail.value)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Saved Addresses */}
                    <View className='saved-row'>
                        {[
                            { icon: '🏠', name: '回家' },
                            { icon: '🏢', name: '公司' },
                            { icon: '⭐', name: '父母家' },
                            { icon: '➕', name: '添加' },
                        ].map((addr, i) => (
                            <View className='saved-chip' key={i}>
                                <Text className='saved-icon'>{addr.icon}</Text>
                                <Text className='saved-name'>{addr.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Remark */}
                    <View className='form-card'>
                        <Text className='fc-label'>📝 备注说明</Text>
                        <Input
                            className='remark-input'
                            placeholder='如: 找前台张小姐，取走A4文件袋'
                            placeholderClass='fc-placeholder'
                            value={remark}
                            onInput={(e) => setRemark(e.detail.value)}
                        />
                    </View>

                    {/* Price Card */}
                    <View className='form-card'>
                        <Text className='fc-label'>💰 费用明细</Text>
                        <View className='price-line'>
                            <Text className='pl-name'>配送费</Text>
                            <Text className='pl-value'>S${deliveryFee.toFixed(2)}</Text>
                        </View>
                        <View className='price-line'>
                            <Text className='pl-name'>平台服务费（3.3%，最低S$2）</Text>
                            <Text className='pl-value'>S${deliveryPlatformFee.toFixed(2)}</Text>
                        </View>

                        {/* Tip */}
                        <View className='tip-section'>
                            <Text className='tip-title'>🎁 小费（可选）</Text>
                            <Text className='tip-hint'>小费100%给到骑手，超时则返回到钱包可供下次使用</Text>
                            <View className='tip-options'>
                                {TIP_OPTIONS.map(t => (
                                    <View
                                        key={t}
                                        className={`tip-chip ${deliveryTip === t ? 'tip-active' : ''}`}
                                        onClick={() => setDeliveryTip(t)}
                                    >
                                        <Text className='tip-text'>{t === 0 ? '不加' : `S$${t}`}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View className='price-divider' />
                        <View className='total-row'>
                            <Text className='total-label'>合计</Text>
                            <Text className='total-value'>S${deliveryTotal.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Submit */}
                    <View className='submit-btn' onClick={handleDeliveryConfirm}>
                        <Text className='submit-text'>确认下单 · S${deliveryTotal.toFixed(2)}</Text>
                    </View>

                    <View style={{ height: '80px' }} />
                </ScrollView>
            )}

            {/* ═══ Tab 1 & 2: AI Chat ═══ */}
            {(activeTab === 1 || activeTab === 2) && (
                <View className='chat-pane'>
                    <View className='agent-strip'>
                        <View className='agent-avatar'>
                            <Text className='agent-avatar-text'>12</Text>
                        </View>
                        <View className='agent-info'>
                            <Text className='agent-name'>{config.name}</Text>
                            <Text className='agent-status'>● 在线 · AI帮你安排</Text>
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
                                        {msg.orderPreview ? (
                                            <View className='order-preview'>
                                                {/* Card Header */}
                                                <View className='op-card-header'>
                                                    <View className='op-card-icon-wrap'>
                                                        <Text className='op-card-icon'>{chatType === 'errand' ? '🛒' : '🏠'}</Text>
                                                    </View>
                                                    <View className='op-card-header-info'>
                                                        <Text className='op-card-title'>订单确认</Text>
                                                        <Text className='op-card-sub'>请确认以下信息无误</Text>
                                                    </View>
                                                </View>

                                                {/* Service Info */}
                                                <View className='op-info-card'>
                                                    <View className='op-info-row'>
                                                        <Text className='op-info-icon'>📌</Text>
                                                        <View className='op-info-content'>
                                                            <Text className='op-info-label'>服务内容</Text>
                                                            <Text className='op-info-value'>{msg.orderPreview.service}</Text>
                                                        </View>
                                                    </View>
                                                    {msg.orderPreview.from && (
                                                        <View className='op-info-row'>
                                                            <Text className='op-info-icon'>🟢</Text>
                                                            <View className='op-info-content'>
                                                                <Text className='op-info-label'>取件/服务地址</Text>
                                                                <Text className='op-info-value'>{msg.orderPreview.from}</Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                    {msg.orderPreview.to && (
                                                        <View className='op-info-row'>
                                                            <Text className='op-info-icon'>🟠</Text>
                                                            <View className='op-info-content'>
                                                                <Text className='op-info-label'>送达地址</Text>
                                                                <Text className='op-info-value'>{msg.orderPreview.to}</Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Pricing Fields */}
                                                <View className='op-pricing'>
                                                    <Text className='op-pricing-title'>💰 费用明细</Text>
                                                    <View className='op-field'>
                                                        <Text className='op-field-label'>花费预算</Text>
                                                        <View className='op-input-wrap'>
                                                            <Text className='op-prefix'>S$</Text>
                                                            <Input className='op-input' type='digit' placeholder='0.00' placeholderClass='fc-placeholder' value={prevBudget} onInput={(e) => setPrevBudget(e.detail.value)} />
                                                        </View>
                                                    </View>
                                                    <View className='op-field'>
                                                        <Text className='op-field-label'>{chatType === 'errand' ? '跑腿费' : '上门费'}</Text>
                                                        <View className='op-input-wrap'>
                                                            <Text className='op-prefix'>S$</Text>
                                                            <Input className='op-input' type='digit' placeholder='0.00' placeholderClass='fc-placeholder' value={prevFee} onInput={(e) => setPrevFee(e.detail.value)} />
                                                        </View>
                                                    </View>
                                                    <View className='op-auto-fee'>
                                                        <Text className='op-auto-label'>平台服务费（3.3%，最低S$2）</Text>
                                                        <Text className='op-auto-value'>S${prevPlatformFee.toFixed(2)}</Text>
                                                    </View>
                                                </View>

                                                {/* Tip */}
                                                <View className='op-tip-section'>
                                                    <Text className='op-tip-label'>🎁 小费（可选）</Text>
                                                    <View className='op-tip-options'>
                                                        {TIP_OPTIONS.map(t => (
                                                            <View key={t} className={`op-tip-chip ${prevTip === t ? 'op-tip-active' : ''}`} onClick={() => setPrevTip(t)}>
                                                                <Text className='op-tip-text'>{t === 0 ? '不加' : `S$${t}`}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                    <Text className='op-tip-hint'>小费100%给到骑手，超时则返回钱包</Text>
                                                </View>

                                                {/* Total */}
                                                <View className='op-total-bar'>
                                                    <Text className='op-total-label'>合计</Text>
                                                    <Text className='op-total-value'>S${prevTotal.toFixed(2)}</Text>
                                                </View>

                                                {/* Pay Btn */}
                                                <View className='op-pay-btn' onClick={() => {
                                                    if (prevBudgetNum <= 0 && prevFeeNum <= 0) {
                                                        Taro.showToast({ title: '请填写预算或费用', icon: 'none' }); return
                                                    }
                                                    Taro.showModal({
                                                        title: '确认支付',
                                                        content: `总计 S$${prevTotal.toFixed(2)}`,
                                                        confirmText: '确认支付',
                                                        confirmColor: '#6B2FE0',
                                                        success: (res) => {
                                                            if (res.confirm) {
                                                                const orderId = generateOrderId()
                                                                const order: Order = {
                                                                    id: orderId,
                                                                    service: msg.orderPreview!.service,
                                                                    from: msg.orderPreview!.from,
                                                                    to: msg.orderPreview!.to,
                                                                    budget: prevBudgetNum,
                                                                    fee: prevFeeNum,
                                                                    platformFee: prevPlatformFee,
                                                                    tip: prevTip,
                                                                    total: prevTotal,
                                                                    type: chatType === 'errand' ? 'errand' : 'onsite',
                                                                    status: 'pending',
                                                                    statusText: '已提交，等待接单',
                                                                    icon: chatType === 'errand' ? '🛒' : '🏠',
                                                                    createdAt: new Date().toISOString(),
                                                                }
                                                                saveOrder(order)
                                                                // Replace preview with tracking card
                                                                setMessages(prev => [...prev, {
                                                                    role: 'ai',
                                                                    content: `✅ 下单成功！\n\n订单号：${orderId}\n状态：已提交，等待骑手接单\n\n你可以在“订单列表”中查看详情，也可以在首页看到进行中的任务。`,
                                                                    time: getNow(),
                                                                    chips: ['查看订单', '返回首页'],
                                                                }])
                                                                Taro.showToast({ title: '下单成功！', icon: 'success' })
                                                            }
                                                        },
                                                    })
                                                }}>
                                                    <Text className='op-pay-text'>确认支付 · S${prevTotal.toFixed(2)}</Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View>
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
                            placeholder={config.placeholder}
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
