import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import * as api from '../../services/api'
import './index.scss'

export default function Profile() {
    const [balance, setBalance] = useState(24.50)
    const [points, setPoints] = useState(580)
    const nav = (url: string) => Taro.navigateTo({ url })

    useDidShow(() => {
        api.getWalletBalance().then(w => {
            setBalance(w.availableBalance)
            setPoints(w.points)
        }).catch(() => { })
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

                {/* Recent Orders */}
                <View className='section'>
                    <View className='section-header'>
                        <Text className='section-title'>最近订单</Text>
                        <Text className='section-more' onClick={() => nav('/pages/orders/index')}>查看全部 ›</Text>
                    </View>

                    {[
                        { icon: '🧋', name: '益昌老街 · 奶茶代买', status: '已完成', time: '今天 09:41', amount: 'S$8.50', color: '#16A34A' },
                        { icon: '🔧', name: '上门清洁 · 3房式', status: '进行中', time: '明天 10:00', amount: 'S$60.00', color: '#F59E0B' },
                    ].map((order, i) => (
                        <View className='order-card' key={i} onClick={() => nav('/pages/orders/index')}>
                            <View className='order-icon-box'>
                                <Text className='order-icon'>{order.icon}</Text>
                            </View>
                            <View className='order-info'>
                                <Text className='order-name'>{order.name}</Text>
                                <Text className='order-time'>{order.time}</Text>
                            </View>
                            <View className='order-right'>
                                <Text className='order-amount'>{order.amount}</Text>
                                <Text className='order-status' style={{ color: order.color }}>{order.status}</Text>
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
