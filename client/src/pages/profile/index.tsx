import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import * as api from '../../services/api'
import { getOrders, type Order } from '../../services/orderStore'
import './index.scss'

export default function Profile() {
    const [balance, setBalance] = useState(24.50)
    const [points, setPoints] = useState(580)
    const [recentOrders, setRecentOrders] = useState<Order[]>([])
    const nav = (url: string) => Taro.navigateTo({ url })

    useDidShow(() => {
        api.getWalletBalance().then(w => {
            setBalance(w.availableBalance)
            setPoints(w.points)
        }).catch(() => { })

        // Load recent orders
        const stored = getOrders()
        const mockFallback: Order[] = [
            { id: 'ORD-20260224-001', service: '益昌老街 · 奶茶代买', from: '', to: '', budget: 5, fee: 3.5, platformFee: 2, tip: 0, total: 8.5, type: 'errand', status: 'completed', statusText: '已完成', icon: '🧋', createdAt: '2026-02-24T09:41:00', runner: '小明 ⭐️4.9' },
            { id: 'ORD-20260224-003', service: '上门清洁 · 3房式', from: '', to: '', budget: 50, fee: 10, platformFee: 2, tip: 5, total: 60, type: 'onsite', status: 'pending', statusText: '进行中', icon: '🧹', createdAt: '2026-02-25T10:00:00', runner: '张师傅 ⭐️5.0' },
        ]
        const ids = new Set(stored.map(o => o.id))
        const merged = [...stored, ...mockFallback.filter(o => !ids.has(o.id))]
        setRecentOrders(merged.slice(0, 3))
    })

    return (
        <View className='profile'>
            {/* Header with gradient */}
            <View className='profile-header'>
                <View className='user-card'>
                    <View className='avatar-wrap'>
                        <View className='avatar-logo'>
                            <Text className='avatar-12'>12</Text>
                            <Text className='avatar-pop'>POP</Text>
                            <Text className='avatar-sub'>优惠泡泡</Text>
                        </View>
                    </View>
                    <View className='user-info'>
                        <Text className='user-name'>Winston Tan</Text>
                        <Text className='user-phone'>+65 9123 ****</Text>
                    </View>
                    <View className='user-badge'>
                        <Text>⭐ 活跃用户</Text>
                    </View>
                </View>

                {/* Stats Pills */}
                <View className='stats-row'>
                    <View className='stat-pill green-pill' onClick={() => nav('/pages/wallet/index')}>
                        <Text className='stat-val'>S${balance.toFixed(2)}</Text>
                        <Text className='stat-label'>钱包余额</Text>
                    </View>
                    <View className='stat-pill purple-pill' onClick={() => nav('/pages/coupons/index')}>
                        <Text className='stat-val'>3</Text>
                        <Text className='stat-label'>优惠券</Text>
                    </View>
                    <View className='stat-pill yellow-pill'>
                        <Text className='stat-val'>{points}</Text>
                        <View className='stat-label-row'>
                            <View className='popcoin-icon popcoin-icon-sm'>
                                <Text className='popcoin-p'>₱</Text>
                            </View>
                            <Text className='stat-label'>POPCoin</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className='profile-body'>
                {/* Quick Actions */}
                <View className='quick-section'>
                    <Text className='quick-title'>快速操作</Text>
                    <View className='quick-actions'>
                        <View className='action-item' onClick={() => nav('/pages/wallet/index')}>
                            <View className='action-icon-box action-green'>
                                <Text className='action-icon-text'>💰</Text>
                            </View>
                            <Text className='action-name'>充值</Text>
                        </View>
                        <View className='action-item' onClick={() => nav('/pages/coupons/index')}>
                            <View className='action-icon-box action-pink'>
                                <Text className='action-icon-text'>🎁</Text>
                            </View>
                            <Text className='action-name'>优惠券</Text>
                        </View>
                        <View className='action-item'>
                            <View className='action-icon-box action-yellow'>
                                <Text className='action-icon-text'>⭐</Text>
                            </View>
                            <Text className='action-name'>收藏</Text>
                        </View>
                        <View className='action-item'>
                            <View className='action-icon-box action-purple'>
                                <Text className='action-icon-text'>💌</Text>
                            </View>
                            <Text className='action-name'>邀请</Text>
                        </View>
                    </View>
                </View>

                {/* Order Management Card */}
                <View className='section'>
                    <View className='section-header'>
                        <Text className='section-title'>订单管理</Text>
                        <Text className='section-more' onClick={() => nav('/pages/orders/index')}>查看全部 ›</Text>
                    </View>
                    <View className='order-mgmt-card'>
                        <View className='om-tabs'>
                            <View className='om-tab' onClick={() => nav('/pages/orders/index')}>
                                <View className='om-tab-icon om-icon-all'>
                                    <Text className='om-tab-emoji'>📋</Text>
                                </View>
                                <Text className='om-tab-name'>全部订单</Text>
                            </View>
                            <View className='om-tab' onClick={() => nav('/pages/orders/index')}>
                                <View className='om-tab-icon om-icon-pending'>
                                    <Text className='om-tab-emoji'>📦</Text>
                                </View>
                                <Text className='om-tab-name'>进行中</Text>
                                {recentOrders.some(o => o.status !== 'completed' && o.status !== 'cancelled') && (
                                    <View className='om-badge' />
                                )}
                            </View>
                            <View className='om-tab' onClick={() => nav('/pages/orders/index')}>
                                <View className='om-tab-icon om-icon-done'>
                                    <Text className='om-tab-emoji'>✅</Text>
                                </View>
                                <Text className='om-tab-name'>已完成</Text>
                            </View>
                            <View className='om-tab' onClick={() => nav('/pages/orders/index')}>
                                <View className='om-tab-icon om-icon-refund'>
                                    <Text className='om-tab-emoji'>💳</Text>
                                </View>
                                <Text className='om-tab-name'>退款/售后</Text>
                            </View>
                        </View>
                    </View>

                    {/* Recent Orders */}
                    {recentOrders.length > 0 && recentOrders.map((order, i) => (
                        <View className='order-card' key={order.id || i} onClick={() => nav('/pages/orders/index')}>
                            <View className='order-icon-box'>
                                <Text className='order-icon'>{order.icon}</Text>
                            </View>
                            <View className='order-info'>
                                <Text className='order-name'>{order.service}</Text>
                                <Text className='order-time'>{order.id}</Text>
                            </View>
                            <View className='order-right'>
                                <Text className='order-amount'>S${order.total.toFixed(2)}</Text>
                                <Text className='order-status' style={{ color: order.status === 'completed' ? '#16A34A' : '#F59E0B' }}>{order.statusText}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Settings */}
                <View className='section'>
                    <Text className='section-title'>设置</Text>
                    <View className='settings-list'>
                        <View className='setting-item' onClick={() => nav('/pages/address/index')}>
                            <Text className='setting-icon'>⊙</Text>
                            <Text className='setting-name'>地址管理</Text>
                            <Text className='chevron'>›</Text>
                        </View>
                        <View className='setting-item'>
                            <Text className='setting-icon'>⊟</Text>
                            <Text className='setting-name'>支付设置</Text>
                            <Text className='chevron'>›</Text>
                        </View>
                        <View className='setting-item'>
                            <Text className='setting-icon'>🔔</Text>
                            <Text className='setting-name'>通知设置</Text>
                            <Text className='chevron'>›</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: '140px' }} />
            </ScrollView>
        </View>
    )
}
