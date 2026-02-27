import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { getActiveOrders, type Order } from '../../services/orderStore'
import './index.scss'

export default function Home() {
    const [inputValue, setInputValue] = useState('')
    const [activeOrders, setActiveOrders] = useState<Order[]>([])

    useDidShow(() => {
        setActiveOrders(getActiveOrders())
    })

    const goToErrand = (tab?: number) => {
        if (tab !== undefined) Taro.setStorageSync('errandTab', tab)
        Taro.navigateTo({ url: '/pages/errand/index' })
    }

    const goToHomeService = () => {
        Taro.setStorageSync('errandTab', 2)
        Taro.navigateTo({ url: '/pages/errand/index' })
    }

    const handleAISubmit = () => {
        if (inputValue.trim()) {
            Taro.setStorageSync('pendingQuery', inputValue)
            setInputValue('')
        }
        Taro.switchTab({ url: '/pages/aiAssistant/index' })
    }

    return (
        <View className='home'>
            {/* Header */}
            <View className='header'>
                <View className='header-top'>
                    <View className='logo'>
                        <View className='logo-circle'>
                            <Text className='logo-12'>12</Text>
                            <Text className='logo-pop-text'>POP</Text>
                            <Text className='logo-bubble'>优惠泡泡</Text>
                        </View>
                        <View className='logo-text'>
                            <Text className='logo-name'>12POP</Text>
                        </View>
                    </View>
                    <View className='bell-wrap'>
                        <Text className='bell'>🔔</Text>
                    </View>
                </View>
                <View className='greeting'>
                    <Text>早上好，Winston 👋</Text>
                    <Text className='greeting-bold'>12POP，每天帮你解决一件生活小事</Text>
                </View>
                <View className='ai-bar'>
                    <View className='ai-gem'>✨</View>
                    <Input
                        className='ai-input'
                        placeholder='帮我买杯奶茶、要杯热的...'
                        placeholderClass='ai-placeholder'
                        value={inputValue}
                        onInput={(e) => setInputValue(e.detail.value)}
                        onConfirm={handleAISubmit}
                    />
                    <View className='ai-send' onClick={handleAISubmit}>→</View>
                </View>
            </View>

            <ScrollView scrollY className='home-body'>
                {/* Active Orders */}
                {activeOrders.length > 0 && (
                    <View className='section'>
                        <View className='section-header'>
                            <Text className='section-title'>进行中的任务</Text>
                            <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/orders/index' })}>全部</Text>
                        </View>
                        {activeOrders.slice(0, 2).map(order => (
                            <View className='active-order' key={order.id} onClick={() => Taro.navigateTo({ url: '/pages/orders/index' })}>
                                <View className='ao-icon-wrap'>
                                    <Text className='ao-icon'>{order.icon}</Text>
                                </View>
                                <View className='ao-info'>
                                    <Text className='ao-name'>{order.service}</Text>
                                    <Text className='ao-meta'>{order.id} · S${order.total.toFixed(2)}</Text>
                                </View>
                                <View className='ao-status-wrap'>
                                    <View className='ao-status-dot' />
                                    <Text className='ao-status'>{order.statusText}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Services */}
                <View className='section'>
                    <View className='section-header'>
                        <Text className='section-title'>选择服务</Text>
                    </View>

                    {/* Errand Wide Card */}
                    <View className='svc-wide' onClick={() => goToErrand(0)}>
                        <View className='svc-wide-icon-wrap'>
                            <View className='svc-wide-icon-box'>
                                <View className='svc-wide-svg' />
                            </View>
                        </View>
                        <View className='svc-wide-main'>
                            <Text className='svc-wide-name'>跑腿</Text>
                            <Text className='svc-wide-sub'>同城取送 · 代买帮办 · 其他代办</Text>
                            <View className='svc-wide-pills'>
                                <Text className='pill' onClick={(e) => { e.stopPropagation(); goToErrand(0) }}>同城取送</Text>
                                <Text className='pill' onClick={(e) => { e.stopPropagation(); goToErrand(1) }}>AI代买</Text>
                                <Text className='pill' onClick={(e) => { e.stopPropagation(); goToErrand(2) }}>其他代办</Text>
                            </View>
                        </View>
                        <View className='svc-wide-badge'>热门</View>
                    </View>

                    {/* Two small cards */}
                    <View className='svc-row'>
                        <View className='svc-card' onClick={goToHomeService}>
                            <View className='svc-svg-icon svc-svg-house' />
                            <Text className='svc-name'>上门服务</Text>
                            <Text className='svc-desc'>清洁维修 到家安装</Text>
                        </View>
                        <View className='svc-card' onClick={() => Taro.navigateTo({ url: '/pages/coupons/index' })}>
                            <View className='svc-svg-icon svc-svg-shop' />
                            <Text className='svc-name'>自取优惠</Text>
                            <Text className='svc-desc'>附近折扣 到店自取</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Reorder */}
                <View className='section'>
                    <Text className='section-title'>常用需求</Text>
                    <View className='quick-scroll'>
                        <View className='quick-chip' onClick={() => {
                            Taro.setStorageSync('errandTab', 1)
                            Taro.setStorageSync('pendingQuery', '帮我买一杯益昌老街奶茶')
                            Taro.navigateTo({ url: '/pages/errand/index' })
                        }}>
                            <View className='qc-icon orange-qc'>
                                <Text className='qc-emoji'>📦</Text>
                            </View>
                            <View>
                                <Text className='quick-name'>益昌老街奶茶</Text>
                                <Text className='quick-sub'>今天 · 上次 S$5....</Text>
                            </View>
                        </View>
                        <View className='quick-chip' onClick={() => goToErrand(0)}>
                            <View className='qc-icon purple-qc'>
                                <Text className='qc-emoji'>📍</Text>
                            </View>
                            <View>
                                <Text className='quick-name'>公司 → 家</Text>
                                <Text className='quick-sub'>取货 · 常用路线</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Nearby Deals */}
                <View className='section'>
                    <View className='section-header'>
                        <Text className='section-title'>附近自取优惠</Text>
                        <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/coupons/index' })}>全部</Text>
                    </View>
                    <View className='deals-scroll'>
                        {[
                            { name: '手工珍珠奶茶', price: 'S$3.50', orig: 'S$7', disc: '5折', dist: '100m', bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' },
                            { name: '叻沙套餐', price: 'S$6.30', orig: 'S$9', disc: '7折', dist: '280m', bg: 'linear-gradient(135deg, #A7F3D0, #059669)' },
                        ].map((deal, i) => (
                            <View className='deal-card' key={i} onClick={() => {
                                Taro.showToast({ title: `${deal.name} · 到店自取`, icon: 'none' })
                            }}>
                                <View className='deal-img' style={{ background: deal.bg }}>
                                    <Text className='deal-badge'>{deal.disc}</Text>
                                </View>
                                <View className='deal-body'>
                                    <Text className='deal-name'>{deal.name}</Text>
                                    <View className='deal-prices'>
                                        <Text className='deal-price'>{deal.price}</Text>
                                        <Text className='deal-orig'>{deal.orig}</Text>
                                    </View>
                                    <Text className='deal-dist'>📍 {deal.dist}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: '120px' }} />
            </ScrollView>
        </View>
    )
}
