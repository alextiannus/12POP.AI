import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useI18n } from '../../i18n'
import './index.scss'

const MOCK_ORDERS = [
    { id: 'ORD-20260224-001', icon: '🧋', name: '益昌老街 · 奶茶代买', status: 'completed', statusText: '已完成', time: '今天 09:41', amount: 'S$8.50', color: '#16A34A', runner: '小明 ⭐4.9', type: '代买' },
    { id: 'ORD-20260224-002', icon: '📦', name: '公司 → 家 取送', status: 'completed', statusText: '已完成', time: '昨天 14:22', amount: 'S$8.00', color: '#16A34A', runner: '阿华 ⭐4.8', type: '同城取送' },
    { id: 'ORD-20260224-003', icon: '🧹', name: '上门清洁 · 3房式', status: 'pending', statusText: '进行中', time: '明天 10:00', amount: 'S$60.00', color: '#F59E0B', runner: '张师傅 ⭐5.0', type: '上门服务' },
    { id: 'ORD-20260223-004', icon: '📋', name: 'NUS取文件', status: 'completed', statusText: '已完成', time: '3天前', amount: 'S$12.00', color: '#16A34A', runner: '小李 ⭐4.7', type: '其他代办' },
    { id: 'ORD-20260220-005', icon: '🛒', name: '超市采购 · FairPrice', status: 'completed', statusText: '已完成', time: '5天前', amount: 'S$35.80', color: '#16A34A', runner: '小明 ⭐4.9', type: '代买' },
]

export default function Orders() {
    const { t } = useI18n()
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

    const filtered = filter === 'all'
        ? MOCK_ORDERS
        : MOCK_ORDERS.filter(o => o.status === filter)

    return (
        <View className='orders-page'>
            <View className='orders-header'>
                <View className='status-bar' />
                <View className='sub-header-top'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>‹</View>
                    <Text className='sub-title'>{t('orders_title')}</Text>
                </View>
                <View className='order-filters'>
                    {(['all', 'pending', 'completed'] as const).map(f => (
                        <Text
                            key={f}
                            className={`order-filter ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? t('all_orders') : f === 'pending' ? t('pending') : t('completed')}
                        </Text>
                    ))}
                </View>
            </View>

            <ScrollView scrollY className='orders-body'>
                {filtered.map(order => (
                    <View className='order-card' key={order.id}>
                        <View className='order-top'>
                            <Text className='order-id'>{order.id}</Text>
                            <Text className='order-status' style={{ color: order.color }}>{order.statusText}</Text>
                        </View>
                        <View className='order-main'>
                            <View className='order-icon-box'>
                                <Text className='order-icon'>{order.icon}</Text>
                            </View>
                            <View className='order-info'>
                                <Text className='order-name'>{order.name}</Text>
                                <Text className='order-meta'>{order.type} · {order.time}</Text>
                                <Text className='order-runner'>🏃 {order.runner}</Text>
                            </View>
                            <Text className='order-amount'>{order.amount}</Text>
                        </View>
                        <View className='order-actions'>
                            <View className='order-btn'>{t('order_detail')}</View>
                            <View className='order-btn outline'>再次下单</View>
                        </View>
                    </View>
                ))}
                <View style={{ height: '100px' }} />
            </ScrollView>
        </View>
    )
}
