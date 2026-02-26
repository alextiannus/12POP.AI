import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const NEARBY_DEALS = [
    { id: '1', shop: '益昌老街', dist: '350m', icon: '☕', item: '招牌奶茶', orig: 'S$5.50', deal: 'S$3.90', tag: '自取7折', cat: 'drink' },
    { id: '2', shop: '168 小厨', dist: '500m', icon: '🍜', item: '海南鸡饭', orig: 'S$6.00', deal: 'S$4.50', tag: '自取75折', cat: 'food' },
    { id: '3', shop: 'NTUC FairPrice', dist: '800m', icon: '🛒', item: '日用品满$20减$3', orig: '', deal: '减S$3', tag: '超市优惠', cat: 'market' },
    { id: '4', shop: '好运来面包店', dist: '200m', icon: '🥐', item: '全麦吐司+咖啡', orig: 'S$8.00', deal: 'S$5.50', tag: '套餐价', cat: 'food' },
    { id: '5', shop: 'Cheers便利店', dist: '150m', icon: '🏪', item: '第二杯半价', orig: '', deal: '半价', tag: '饮品特惠', cat: 'drink' },
    { id: '6', shop: '阿明虾面', dist: '600m', icon: '🦐', item: '特色虾面', orig: 'S$7.00', deal: 'S$5.00', tag: '自取优惠', cat: 'food' },
    { id: '7', shop: '鲜花小铺', dist: '1.2km', icon: '💐', item: '鲜花花束', orig: 'S$25', deal: 'S$18', tag: '限时抢', cat: 'other' },
    { id: '8', shop: '水果摊', dist: '300m', icon: '🍉', item: '时令水果拼盘', orig: 'S$12', deal: 'S$8', tag: '当日鲜', cat: 'food' },
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
                        <Text className='deals-loc-text'>500m内</Text>
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

            {/* Deals List */}
            <ScrollView scrollY className='deals-body'>
                {filtered.map(deal => (
                    <View className='deal-card' key={deal.id} onClick={() => {
                        Taro.showModal({
                            title: `${deal.shop} · ${deal.item}`,
                            content: `优惠价 ${deal.deal}${deal.orig ? `（原价 ${deal.orig}）` : ''}\n距离 ${deal.dist}\n\n到店出示此页面即可享受优惠`,
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
                        <View className='deal-icon-box'>
                            <Text className='deal-icon'>{deal.icon}</Text>
                        </View>
                        <View className='deal-info'>
                            <View className='deal-shop-row'>
                                <Text className='deal-shop'>{deal.shop}</Text>
                                <Text className='deal-dist'>{deal.dist}</Text>
                            </View>
                            <Text className='deal-item'>{deal.item}</Text>
                            <View className='deal-price-row'>
                                <Text className='deal-price'>{deal.deal}</Text>
                                {deal.orig && <Text className='deal-orig'>{deal.orig}</Text>}
                            </View>
                        </View>
                        <View className='deal-tag'>
                            <Text className='deal-tag-text'>{deal.tag}</Text>
                        </View>
                    </View>
                ))}
                <View style={{ height: '80px' }} />
            </ScrollView>
        </View>
    )
}
