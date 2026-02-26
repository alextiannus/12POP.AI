import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const NEARBY_DEALS = [
    { id: '1', name: '手工珍珠奶茶', price: 'S$3.50', orig: 'S$7', disc: '5折', dist: '100m', bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)', cat: 'drink' },
    { id: '2', name: '叻沙套餐', price: 'S$6.30', orig: 'S$9', disc: '7折', dist: '280m', bg: 'linear-gradient(135deg, #A7F3D0, #059669)', cat: 'food' },
    { id: '3', name: '海南鸡饭', price: 'S$4.50', orig: 'S$6', disc: '75折', dist: '500m', bg: 'linear-gradient(135deg, #FECACA, #EF4444)', cat: 'food' },
    { id: '4', name: '全麦吐司+咖啡', price: 'S$5.50', orig: 'S$8', disc: '套餐价', dist: '200m', bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)', cat: 'food' },
    { id: '5', name: '第二杯半价', price: '半价', orig: '', disc: '限时', dist: '150m', bg: 'linear-gradient(135deg, #BAE6FD, #0EA5E9)', cat: 'drink' },
    { id: '6', name: '特色虾面', price: 'S$5.00', orig: 'S$7', disc: '自取价', dist: '600m', bg: 'linear-gradient(135deg, #FED7AA, #F97316)', cat: 'food' },
    { id: '7', name: '鲜花花束', price: 'S$18', orig: 'S$25', disc: '限时抢', dist: '1.2km', bg: 'linear-gradient(135deg, #FBCFE8, #EC4899)', cat: 'other' },
    { id: '8', name: '时令水果拼盘', price: 'S$8', orig: 'S$12', disc: '当日鲜', dist: '300m', bg: 'linear-gradient(135deg, #BBF7D0, #22C55E)', cat: 'food' },
    { id: '9', name: '日用品满减', price: '减S$3', orig: '满S$20', disc: '超市', dist: '800m', bg: 'linear-gradient(135deg, #E0E7FF, #6366F1)', cat: 'market' },
    { id: '10', name: '椰浆饭套餐', price: 'S$3.80', orig: 'S$5.50', disc: '7折', dist: '450m', bg: 'linear-gradient(135deg, #CCFBF1, #14B8A6)', cat: 'food' },
]

const CATS = [
    { key: 'all', label: '全部' },
    { key: 'food', label: '🍜 美食' },
    { key: 'drink', label: '☕ 饮品' },
    { key: 'market', label: '🛒 超市' },
    { key: 'other', label: '🎁 其他' },
]

export default function Coupons() {
    const [cat, setCat] = useState('all')

    const filtered = cat === 'all' ? NEARBY_DEALS : NEARBY_DEALS.filter(d => d.cat === cat)

    return (
        <View className='deals-page'>
            {/* Header */}
            <View className='deals-header'>
                <View className='status-bar' />
                <View className='deals-header-row'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='deals-title'>附近自取优惠</Text>
                    <View className='deals-loc'>
                        <Text className='deals-loc-icon'>📍</Text>
                        <Text className='deals-loc-text'>附近</Text>
                    </View>
                </View>
                {/* Category Filter */}
                <ScrollView scrollX className='deals-cats'>
                    {CATS.map(c => (
                        <View
                            key={c.key}
                            className={`deals-cat ${cat === c.key ? 'deals-cat-active' : ''}`}
                            onClick={() => setCat(c.key)}
                        >
                            <Text className={`deals-cat-text ${cat === c.key ? 'deals-cat-text-active' : ''}`}>{c.label}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Deals Grid */}
            <ScrollView scrollY className='deals-body'>
                <View className='deals-grid'>
                    {filtered.map(deal => (
                        <View className='deal-card' key={deal.id} onClick={() => {
                            Taro.showModal({
                                title: deal.name,
                                content: `优惠价 ${deal.price}${deal.orig ? `（原价 ${deal.orig}）` : ''}\n距离 ${deal.dist}\n\n到店出示此页面即可享受优惠`,
                                confirmText: '导航到店',
                                cancelText: '关闭',
                                confirmColor: '#6B2FE0',
                                success: (res) => {
                                    if (res.confirm) {
                                        Taro.showToast({ title: '正在为您导航…', icon: 'none' })
                                    }
                                },
                            })
                        }}>
                            <View className='deal-img' style={{ background: deal.bg }}>
                                <Text className='deal-badge'>{deal.disc}</Text>
                            </View>
                            <View className='deal-body'>
                                <Text className='deal-name'>{deal.name}</Text>
                                <View className='deal-prices'>
                                    <Text className='deal-price'>{deal.price}</Text>
                                    {deal.orig && <Text className='deal-orig'>{deal.orig}</Text>}
                                </View>
                                <Text className='deal-dist'>📍 {deal.dist}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ height: '80px' }} />
            </ScrollView>
        </View>
    )
}
