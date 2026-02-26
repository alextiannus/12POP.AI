import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useI18n } from '../../i18n'
import './index.scss'

const MOCK_COUPONS = [
    { id: '1', title: '新用户跑腿减免', amount: 'S$5', desc: '跑腿订单满S$8可用', status: 'available', expiry: '2026-03-31', color: '#6B2FE0' },
    { id: '2', title: '上门服务折扣', amount: '8折', desc: '上门清洁/维修服务可用', status: 'available', expiry: '2026-03-15', color: '#059669' },
    { id: '3', title: '首单奶茶减免', amount: 'S$3', desc: '代买饮品订单可用', status: 'available', expiry: '2026-04-01', color: '#D97706' },
    { id: '4', title: '周末取送优惠', amount: 'S$2', desc: '同城取送订单可用', status: 'used', expiry: '2026-02-20', color: '#9CA3AF' },
    { id: '5', title: '节日清洁优惠', amount: 'S$10', desc: '上门深度清洁可用', status: 'expired', expiry: '2026-01-31', color: '#9CA3AF' },
]

export default function Coupons() {
    const { t } = useI18n()
    const [filter, setFilter] = useState<'available' | 'used' | 'expired'>('available')

    const filtered = MOCK_COUPONS.filter(c => c.status === filter)

    return (
        <View className='coupons-page'>
            <View className='coupons-header'>
                <View className='status-bar' />
                <View className='sub-header-top'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>‹</View>
                    <Text className='sub-title'>{t('coupon_title')}</Text>
                </View>
                <View className='coupon-tabs'>
                    {(['available', 'used', 'expired'] as const).map(f => (
                        <Text
                            key={f}
                            className={`coupon-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'available' ? `${t('available')} (3)` : f === 'used' ? t('used') : t('expired')}
                        </Text>
                    ))}
                </View>
            </View>

            <ScrollView scrollY className='coupons-body'>
                {filtered.length === 0 && (
                    <View className='empty'>
                        <Text className='empty-icon'>🎟️</Text>
                        <Text className='empty-text'>暂无优惠券</Text>
                    </View>
                )}
                {filtered.map(coupon => (
                    <View className={`coupon-card ${coupon.status}`} key={coupon.id}>
                        <View className='coupon-left' style={{ background: coupon.color }}>
                            <Text className='coupon-amount'>{coupon.amount}</Text>
                            <Text className='coupon-type'>OFF</Text>
                        </View>
                        <View className='coupon-right'>
                            <Text className='coupon-title'>{coupon.title}</Text>
                            <Text className='coupon-desc'>{coupon.desc}</Text>
                            <View className='coupon-footer'>
                                <Text className='coupon-expiry'>{t('valid_until')} {coupon.expiry}</Text>
                                {coupon.status === 'available' && (
                                    <View className='coupon-use'>{t('use_now')}</View>
                                )}
                            </View>
                        </View>
                    </View>
                ))}
                <View style={{ height: '100px' }} />
            </ScrollView>
        </View>
    )
}
