import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import * as api from '../../services/api'
import './index.scss'

// Chat message type
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

const TIP_OPTIONS = [0, 3, 5, 8]
const PLATFORM_FEE_RATE = 0.0325

export default function Errand() {
    const [activeTab, setActiveTab] = useState(0)
    const [chatInput, setChatInput] = useState('')
    const [showQuote, setShowQuote] = useState(false)
    const [showTracker, setShowTracker] = useState(false)
    const [trackerStep, setTrackerStep] = useState(0)
    const [deliveryTip, setDeliveryTip] = useState(3)
    const [quoteTip, setQuoteTip] = useState(3)
    const [isStreaming, setIsStreaming] = useState(false)
    const [quoteData, setQuoteData] = useState<api.Quote | null>(null)
    const [walletBalance, setWalletBalance] = useState(24.50)
    const taskIdRef = useRef<string | null>(null)
    const conversationIdRef = useRef<string | null>(null)
    const pollingRef = useRef<any>(null)
    const [messages, setMessages] = useState<ChatMsg[]>([
        {
            role: 'ai',
            content: '你好！告诉我你想买什么，我来帮你搞定 🛒\n包括菜市场、小贩中心、超市都可以！',
            time: getNow(),
            chips: ['帮我买奶茶', '超市采购', '小贩中心外卖'],
        },
    ])

    // Initialize conversation on first load
    const ensureConversation = useCallback(async () => {
        if (!conversationIdRef.current) {
            try {
                const conv = await api.createConversation('shopping')
                conversationIdRef.current = conv.id
            } catch {
                conversationIdRef.current = 'local-' + Date.now()
            }
        }
        return conversationIdRef.current!
    }, [])

    // Fetch wallet balance
    const refreshWallet = useCallback(async () => {
        try {
            const w = await api.getWalletBalance()
            setWalletBalance(w.availableBalance)
        } catch { /* keep current */ }
    }, [])

    // Poll task status for tracker
    const startTaskPolling = useCallback((id: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current)
        const statusToStep: Record<string, number> = {
            'dispatched': 0, 'assigned': 1, 'arrived': 2, 'picked_up': 3, 'completed': 4,
        }
        pollingRef.current = setInterval(async () => {
            try {
                const task = await api.getTask(id)
                const step = statusToStep[task.status]
                if (step !== undefined) setTrackerStep(step)
                if (task.status === 'completed' || task.status === 'exception') {
                    clearInterval(pollingRef.current)
                    pollingRef.current = null
                    refreshWallet()
                }
            } catch { /* retry next tick */ }
        }, 2000)
    }, [refreshWallet])

    // Each time this tab page becomes visible, check for stored tab selection
    useDidShow(() => {
        const savedTab = Taro.getStorageSync('errandTab')
        if (savedTab !== '' && savedTab !== undefined) {
            setActiveTab(Number(savedTab))
            Taro.removeStorageSync('errandTab')
        }
        // Check for pending AI query
        const pendingQuery = Taro.getStorageSync('pendingQuery')
        if (pendingQuery) {
            Taro.removeStorageSync('pendingQuery')
            setActiveTab(1)
            // Slight delay to ensure tab switched
            setTimeout(() => {
                handleSendMessage(pendingQuery)
            }, 300)
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

        // Add placeholder for AI response
        // Add placeholder for AI streaming response
        setMessages(prev => [...prev, { role: 'ai', content: '', time: getNow() }])

        api.sendMessage(convId, msg, {
            onText: (chunk) => {
                setMessages(prev => {
                    const updated = [...prev]
                    const lastAi = updated[updated.length - 1]
                    if (lastAi && lastAi.role === 'ai') {
                        lastAi.content += chunk
                    }
                    return [...updated]
                })
            },
            onSlots: () => { /* slot data received, tracked server-side */ },
            onSlotsComplete: async (data) => {
                // All slots filled — generate quote from API
                try {
                    const quote = await api.generateQuote(data.serviceType, data.slotData)
                    setQuoteData(quote)
                    await refreshWallet()
                    setTimeout(() => setShowQuote(true), 500)
                } catch {
                    // Fallback: show quote with defaults
                    setTimeout(() => setShowQuote(true), 500)
                }
            },
            onDone: () => {
                setIsStreaming(false)
            },
            onError: () => {
                // Fallback to mock response on API error
                setMessages(prev => {
                    const updated = [...prev]
                    const lastAi = updated[updated.length - 1]
                    if (lastAi && lastAi.role === 'ai' && !lastAi.content) {
                        lastAi.content = `收到！帮你去买 🛒\n\n确认一下：\n▸ **商品**：${msg}\n\n请告诉我：\n1. 从哪家店买？\n2. 送到哪个地址？`
                        lastAi.chips = ['益昌老街', '超市随意买', '送到我家']
                    }
                    return [...updated]
                })
                setIsStreaming(false)
            },
        })
    }

    const handleConfirmPayment = async () => {
        setShowQuote(false)
        setShowTracker(true)
        setTrackerStep(0)

        if (quoteData) {
            try {
                const result = await api.confirmQuote(quoteData.id, {
                    conversationId: conversationIdRef.current || undefined,
                    serviceType: quoteData.serviceType,
                    slotData: {},
                    totalAmount: quoteData.totalAmount,
                    tip: quoteTip,
                })
                taskIdRef.current = result.taskId
                setWalletBalance(result.wallet.availableBalance)
                startTaskPolling(result.taskId)

                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: `✅ ${result.message}\n\n实时状态请看下方 👇`,
                    time: getNow(),
                }])
                return
            } catch { /* fall through to mock */ }
        }

        // Fallback mock tracker
        const delays = [2000, 5000, 9000, 14000]
        delays.forEach((delay, i) => {
            setTimeout(() => setTrackerStep(i + 1), delay)
        })
        setMessages(prev => [...prev, {
            role: 'ai',
            content: '✅ 支付成功！已为你安排跑腿员，实时状态请看下方 👇',
            time: getNow(),
        }])
    }

    const handleChipClick = (chip: string) => {
        handleSendMessage(chip)
    }

    const handleDeliveryConfirm = (total: number) => {
        Taro.showModal({
            title: '确认下单',
            content: `将从钱包扣除 S$${total.toFixed(2)}，确认下单？`,
            confirmText: '确认支付',
            confirmColor: '#6B2FE0',
            success: (res) => {
                if (res.confirm) {
                    Taro.showToast({ title: '下单成功！配送员正在赶来', icon: 'success', duration: 2000 })
                }
            }
        })
    }

    const switchTab = (index: number) => {
        setActiveTab(index)
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
                    <View className='back-btn' onClick={goHome}>‹</View>
                    <Text className='header-title'>跑腿</Text>
                </View>
                <View className='tab-bar'>
                    {['同城取送', '代买', '其他代办'].map((tab, i) => (
                        <Text
                            key={i}
                            className={`tab ${activeTab === i ? 'active' : ''}`}
                            onClick={() => switchTab(i)}
                        >
                            {tab}
                        </Text>
                    ))}
                </View>
            </View>

            {/* Tab 0: 同城取送 */}
            {activeTab === 0 && (
                <ScrollView scrollY className='tab-content'>
                    {/* Map */}
                    <View className='map-area'>
                        <View className='map-bg' />
                        <View className='map-road h' style={{ top: '32%' }} />
                        <View className='map-road h' style={{ top: '65%' }} />
                        <View className='map-road v' style={{ left: '28%' }} />
                        <View className='map-road v' style={{ left: '58%' }} />
                        <View className='map-route' />
                        <View className='map-pin pin-a'><Text className='pin-label'>A</Text></View>
                        <View className='map-pin pin-b'><Text className='pin-label'>B</Text></View>
                        <View className='map-badge'>
                            <View className='badge-dot' />
                            <Text className='badge-text'>复用唐人街外卖配送网络</Text>
                        </View>
                    </View>

                    {/* Address Form */}
                    <View className='address-form'>
                        <View className='address-row'>
                            <View className='dot dot-a' />
                            <View className='address-content'>
                                <Text className='address-label'>取件地址</Text>
                                <Text className='address-value'>牛车水大厦 #01-12</Text>
                            </View>
                            <Text className='address-add'>⊕</Text>
                        </View>
                        <View className='address-row'>
                            <View className='dot dot-b' />
                            <View className='address-content'>
                                <Text className='address-label'>送达地址</Text>
                                <Text className='address-value placeholder'>点击输入送达地址…</Text>
                            </View>
                            <Text className='address-add'>⊕</Text>
                        </View>
                    </View>

                    {/* Saved Addresses */}
                    <View className='saved-addresses'>
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

                    {/* Instructions */}
                    <View className='instruction-box'>
                        <Text className='instruction-label'>📝 备注说明</Text>
                        <Input
                            className='instruction-input'
                            placeholder='如: 找前台张小姐，取走A4文件袋'
                            placeholderClass='instruction-placeholder'
                        />
                    </View>

                    {/* Price Card */}
                    {(() => {
                        const base = 5.00
                        const dist = 3.00
                        const subtotal = base + dist
                        const platformFee = Math.round((subtotal + deliveryTip) * PLATFORM_FEE_RATE * 100) / 100
                        const total = subtotal + deliveryTip + platformFee
                        return (
                            <View className='price-card'>
                                <View className='price-row'>
                                    <Text className='price-label'>配送基础费</Text>
                                    <Text className='price-value'>S${base.toFixed(2)}</Text>
                                </View>
                                <View className='price-row'>
                                    <Text className='price-label'>距离费（2.3km）</Text>
                                    <Text className='price-value'>S${dist.toFixed(2)}</Text>
                                </View>
                                <View className='price-row'>
                                    <Text className='price-label'>平台服务费（3.25%）</Text>
                                    <Text className='price-value'>S${platformFee.toFixed(2)}</Text>
                                </View>

                                {/* Tip Section */}
                                <View className='tip-section'>
                                    <View className='tip-header'>
                                        <Text className='tip-title'>💰 小费（可选）</Text>
                                        <Text className='tip-hint'>加小费有助于更快接单和准时完成</Text>
                                    </View>
                                    <Text className='tip-rule'>⏱️ 迟到即无效 — 跑腿员迟到将不会获得小费</Text>
                                    <View className='tip-options'>
                                        {TIP_OPTIONS.map((tip) => (
                                            <View
                                                key={tip}
                                                className={`tip-chip ${deliveryTip === tip ? 'tip-active' : ''}`}
                                                onClick={() => setDeliveryTip(tip)}
                                            >
                                                <Text className='tip-amount'>{tip === 0 ? '不加' : `S$${tip}`}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <View className='price-divider' />
                                <View className='price-row total'>
                                    <Text className='price-total-label'>合计</Text>
                                    <Text className='price-total-value'>S${total.toFixed(2)}</Text>
                                </View>
                                {deliveryTip > 0 && (
                                    <Text className='tip-included'>含小费 S${deliveryTip.toFixed(2)}</Text>
                                )}
                                <Text className='wallet-note'>💳  钱包余额 S$24.50 · 付款后余额 S${(24.50 - total).toFixed(2)}</Text>
                                <View className='btn-primary' onClick={() => handleDeliveryConfirm(total)}>确认下单 · 从钱包支付 S${total.toFixed(2)}</View>
                            </View>
                        )
                    })()}
                </ScrollView>
            )}

            {/* Tab 1: 代买 (AI Chat) */}
            {activeTab === 1 && (
                <View className='chat-pane'>
                    {/* Agent Strip */}
                    <View className='agent-strip'>
                        <View className='agent-avatar'>🤖</View>
                        <View className='agent-info'>
                            <Text className='agent-name'>12POP AI 代买助手</Text>
                            <Text className='agent-status'>● 在线 · 响应 &lt;30秒</Text>
                        </View>
                        <View className='agent-badge'>
                            <Text className='agent-badge-text'>预算冻结{'\n'}小票核销</Text>
                        </View>
                    </View>

                    {/* Chat Messages */}
                    <ScrollView scrollY className='chat-scroll' scrollIntoView={`msg-${messages.length - 1}`}>
                        <View className='chat-messages'>
                            {messages.map((msg, i) => (
                                <View className={`msg ${msg.role}`} key={i} id={`msg-${i}`}>
                                    {msg.role === 'ai' && <View className='msg-avatar'>🤖</View>}
                                    <View className='msg-group'>
                                        <View className='msg-bubble'>{msg.content}</View>
                                        {msg.chips && (
                                            <View className='msg-chips'>
                                                {msg.chips.map((chip, j) => (
                                                    <Text className='chip-btn' key={j} onClick={() => handleChipClick(chip)}>
                                                        {chip}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    <Text className='msg-time'>{msg.time}</Text>
                                </View>
                            ))}

                            {/* Quote Card */}
                            {showQuote && (() => {
                                const q = quoteData
                                const items = q ? q.lineItems : [
                                    { label: '商品预算（预冻结）', amount: 15, type: 'budget' as const },
                                    { label: '代跑服务费', amount: 5, type: 'fee' as const },
                                    { label: '配送费 (约 2km)', amount: 3, type: 'fee' as const },
                                    { label: '平台服务费（3.25%）', amount: 0.75, type: 'fee' as const },
                                ]
                                const baseTotal = q ? q.totalAmount : 23.75
                                const total = baseTotal + quoteTip
                                const estTime = q ? q.estimatedTime : '约 35 分钟'
                                const notes = q ? q.notes : ['实际消费后多退少不补 · 平台不加价承诺']
                                return (
                                    <View className='quote-card'>
                                        <View className='quote-header'>
                                            <Text className='quote-title'>📋 代购报价单</Text>
                                            <Text className='quote-est'>{estTime}</Text>
                                        </View>
                                        {items.map((item, i) => (
                                            <View className='quote-line' key={i}>
                                                <Text className='quote-item'>{item.label}</Text>
                                                <Text className='quote-price'>S${item.amount.toFixed(2)}</Text>
                                            </View>
                                        ))}

                                        {/* Tip Section */}
                                        <View className='tip-section'>
                                            <View className='tip-header'>
                                                <Text className='tip-title'>💰 小费（可选）</Text>
                                                <Text className='tip-hint'>加小费有助于更快接单和准时完成</Text>
                                            </View>
                                            <Text className='tip-rule'>⏱️ 迟到即无效 — 跑腿员迟到将不会获得小费</Text>
                                            <View className='tip-options'>
                                                {TIP_OPTIONS.map((tip) => (
                                                    <View
                                                        key={tip}
                                                        className={`tip-chip ${quoteTip === tip ? 'tip-active' : ''}`}
                                                        onClick={() => setQuoteTip(tip)}
                                                    >
                                                        <Text className='tip-amount'>{tip === 0 ? '不加' : `S$${tip}`}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        <View className='quote-total'>
                                            <Text className='quote-total-label'>合计冻结</Text>
                                            <Text className='quote-total-value'>S${total.toFixed(2)}</Text>
                                        </View>
                                        {quoteTip > 0 && (
                                            <Text className='tip-included'>含小费 S${quoteTip.toFixed(2)}</Text>
                                        )}
                                        <Text className='quote-note'>💳  从钱包预冻结 · 余额 S${walletBalance.toFixed(2)} → S${(walletBalance - total).toFixed(2)}</Text>
                                        <Text className='quote-note2'>{notes[0] || '实际消费后多退少不补 · 平台不加价承诺'}</Text>
                                        <View className='btn-pay' onClick={handleConfirmPayment}>
                                            确认并冻结 S${total.toFixed(2)}
                                        </View>
                                    </View>
                                )
                            })()}

                            {/* Tracker */}
                            {showTracker && (
                                <View className='tracker'>
                                    <Text className='tracker-title'>📦 实时状态追踪</Text>
                                    {[
                                        { name: '订单已确认', desc: `${getNow()} · 已冻结 S$23.00`, icon: '✓' },
                                        { name: '跑腿员已接单', desc: '小明 ⭐4.9 · 距你 800m', icon: '✓' },
                                        { name: '购买中', desc: '跑腿员已到达商家', icon: '🏃' },
                                        { name: '小票核销 · 确认金额', desc: '系统自动扣款，多退少不补', icon: '📋' },
                                        { name: '配送中', desc: '预计 15 分钟送达', icon: '🚴' },
                                    ].map((step, i) => {
                                        const status = i < trackerStep ? 'done' : i === trackerStep ? 'active' : 'pending'
                                        return (
                                            <View className={`step step-${status}`} key={i}>
                                                <View className={`step-dot ${status}`}>
                                                    <Text>{status === 'done' ? '✓' : status === 'active' ? step.icon : '○'}</Text>
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
                        </View>
                    </ScrollView>

                    {/* Chat Input */}
                    <View className='chat-input-bar'>
                        <Input
                            className='chat-input'
                            placeholder='告诉我你想买什么…'
                            value={chatInput}
                            onInput={(e) => setChatInput(e.detail.value)}
                            onConfirm={() => handleSendMessage()}
                        />
                        <View className='chat-send' onClick={() => handleSendMessage()}>→</View>
                    </View>
                </View>
            )}

            {/* Tab 2: 其他代办 */}
            {activeTab === 2 && (
                <ScrollView scrollY className='tab-content'>
                    <View className='pay-note'>
                        <Text className='pay-note-icon'>💡</Text>
                        <Text className='pay-note-text'>
                            服务费按实际情况报价，平台预冻结后结算。跑腿员完成后凭小票/截图核销，多退少不补。
                        </Text>
                    </View>

                    <View className='section-header'>
                        <Text className='section-title'>常见代办类型</Text>
                    </View>

                    <View className='task-grid'>
                        {[
                            { icon: '🕐', name: '排队代办', sub: '餐厅/机构\n帮我排号', query: '帮我去排队' },
                            { icon: '📋', name: '取文件', sub: '医院/政府\n代取证件', query: '帮我代取文件' },
                            { icon: '💰', name: '代付账单', sub: '缴费/罚款\n代付还款', query: '帮我代付账单' },
                            { icon: '📮', name: '代寄快递', sub: '帮我去\nSingpost投件', query: '帮我代寄快递' },
                            { icon: '🛃', name: '代领包裹', sub: '帮我取\n快递/外卖', query: '帮我代领包裹' },
                            { icon: '✨', name: 'AI 自定义', sub: '描述你的\n需求', ai: true },
                        ].map((item, i) => (
                            <View
                                className={`task-card ${item.ai ? 'ai-card' : ''}`}
                                key={i}
                                onClick={() => {
                                    switchTab(1)
                                    if (item.query) {
                                        setTimeout(() => handleSendMessage(item.query!), 300)
                                    }
                                }}
                            >
                                <Text className='task-icon'>{item.icon}</Text>
                                <Text className={`task-name ${item.ai ? 'ai-name' : ''}`}>{item.name}</Text>
                                <Text className={`task-sub ${item.ai ? 'ai-sub' : ''}`}>{item.sub}</Text>
                            </View>
                        ))}
                    </View>

                    {/* AI CTA */}
                    <View className='ai-cta' onClick={() => switchTab(1)}>
                        <View className='ai-cta-icon'>✨</View>
                        <View className='ai-cta-text'>
                            <Text className='ai-cta-title'>用 AI 描述任何需求</Text>
                            <Text className='ai-cta-sub'>告诉我你要什么，AI 来帮你安排跑腿员</Text>
                        </View>
                        <Text className='ai-cta-arrow'>→</Text>
                    </View>

                    {/* Recent */}
                    <View className='section-header'>
                        <Text className='section-title'>最近的代办</Text>
                    </View>
                    <View className='recent-card' onClick={() => Taro.navigateTo({ url: '/pages/orders/index' })}>
                        <View className='recent-img' style={{ background: 'linear-gradient(135deg, #A5B4FC, #6366F1)' }}>
                            <Text className='recent-tag'>已完成</Text>
                        </View>
                        <View className='recent-info'>
                            <Text className='recent-name'>新加坡国立大学取文件</Text>
                            <View className='recent-meta'>
                                <Text className='recent-status'>✓ 已完成</Text>
                                <Text className='recent-detail'>3天前 · S$12</Text>
                            </View>
                            <View className='recent-tags'>
                                <Text className='tag'>取文件</Text>
                                <Text className='tag' onClick={(e) => {
                                    e.stopPropagation()
                                    switchTab(1)
                                    setTimeout(() => handleSendMessage('帮我再去NUS取一次文件'), 300)
                                }}>再次下单</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    )
}
