import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { getOrders, type Order } from '../../services/orderStore'
import './index.scss'

const MOCK_ORDERS: Order[] = [
    { id: 'ORD-20260224-001', service: '益昌老街 · 奶茶代买', from: '益昌老街', to: '家', budget: 5, fee: 3.5, platformFee: 2, tip: 0, total: 8.5, type: 'errand', status: 'completed', statusText: '已完成', icon: '🧋', createdAt: '2026-02-24T09:41:00', runner: '小明 ⭐4.9' },
    { id: 'ORD-20260224-002', service: '公司 → 家 取送', from: '公司', to: '家', budget: 0, fee: 8, platformFee: 2, tip: 0, total: 8, type: 'delivery', status: 'completed', statusText: '已完成', icon: '📦', createdAt: '2026-02-23T14:22:00', runner: '阿华 ⭐4.8' },
    { id: 'ORD-20260224-003', service: '上门清洁 · 3房式', from: '家', to: '', budget: 50, fee: 10, platformFee: 2, tip: 5, total: 60, type: 'onsite', status: 'pending', statusText: '进行中', icon: '🧹', createdAt: '2026-02-25T10:00:00', runner: '张师傅 ⭐5.0' },
]

function getTimeAgo(iso: string) {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const mins = Math.floor((now - then) / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}小时前`
    const days = Math.floor(hrs / 24)
    if (days === 1) return '昨天'
    return `${days}天前`
}

export default function Orders() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
    const [orders, setOrders] = useState<Order[]>([])

    useDidShow(() => {
        const stored = getOrders()
        // Merge stored orders with mock orders (avoid duplicate IDs)
        const storedIds = new Set(stored.map(o => o.id))
        const merged = [...stored, ...MOCK_ORDERS.filter(o => !storedIds.has(o.id))]
        setOrders(merged)
    })

    const filtered = filter === 'all'
        ? orders
        : orders.filter(o => {
            if (filter === 'pending') return o.status !== 'completed' && o.status !== 'cancelled'
            return o.status === 'completed'
        })

    const statusColor = (s: string) => {
        if (s === 'completed') return '#16A34A'
        if (s === 'cancelled') return '#9CA3AF'
        return '#F59E0B'
    }

    return (
        <View className='orders-page'>
            <View className='orders-header'>
                <View className='status-bar' />
                <View className='sub-header-top'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>‹</View>
                    <Text className='sub-title'>我的订单</Text>
                </View>
                <View className='order-filters'>
                    {(['all', 'pending', 'completed'] as const).map(f => (
                        <Text
                            key={f}
                            className={`order-filter ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? '全部订单' : f === 'pending' ? '进行中' : '已完成'}
                        </Text>
                    ))}
                </View>
            </View>

            <ScrollView scrollY className='orders-body'>
                {filtered.length === 0 && (
                    <View className='empty'>
                        <Text className='empty-icon'>📋</Text>
                        <Text className='empty-text'>暂无订单</Text>
                    </View>
                )}
                {filtered.map(order => (
                    <View className='order-card' key={order.id}>
                        <View className='order-top'>
                            <Text className='order-id'>{order.id}</Text>
                            <Text className='order-status' style={{ color: statusColor(order.status) }}>{order.statusText}</Text>
                        </View>
                        <View className='order-main'>
                            <View className='order-icon-box'>
                                <Text className='order-icon'>{order.icon}</Text>
                            </View>
                            <View className='order-info'>
                                <Text className='order-name'>{order.service}</Text>
                                <Text className='order-meta'>
                                    {order.type === 'errand' ? '跑腿代买' : order.type === 'onsite' ? '上门服务' : '同城配送'} · {getTimeAgo(order.createdAt)}
                                </Text>
                                {order.runner && <Text className='order-runner'>🏃 {order.runner}</Text>}
                            </View>
                            <Text className='order-amount'>S${order.total.toFixed(2)}</Text>
                        </View>
                        <View className='order-actions'>
                            <View className='order-btn' onClick={() => {
                                Taro.showModal({
                                    title: `订单详情`,
                                    content: `${order.service}\n\n预算: S$${order.budget.toFixed(2)}\n${order.type === 'errand' ? '跑腿费' : order.type === 'onsite' ? '上门费' : '配送费'}: S$${order.fee.toFixed(2)}\n平台费: S$${order.platformFee.toFixed(2)}\n小费: S$${order.tip.toFixed(2)}\n总计: S$${order.total.toFixed(2)}\n\n状态: ${order.statusText}`,
                                    showCancel: false,
                                })
                            }}>查看详情</View>
                            <View className='order-btn outline' onClick={() => {
                                Taro.setStorageSync('errandTab', order.type === 'onsite' ? 2 : 1)
                                Taro.navigateTo({ url: '/pages/errand/index' })
                            }}>再次下单</View>
                        </View>
                    </View>
                ))}
                <View style={{ height: '100px' }} />
            </ScrollView>
        </View>
    )
}
