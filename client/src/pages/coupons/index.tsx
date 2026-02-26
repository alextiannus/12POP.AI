import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const BANNERS = [
    { title: '☀️ 今日限时秒杀', sub: '精选美食低至3折', bg: 'linear-gradient(135deg, #FF6B35, #FF3C78)' },
    { title: '🍜 新店开业', sub: '全场5折·限量100份', bg: 'linear-gradient(135deg, #6B2FE0, #9B62FF)' },
]

const CATS = [
    { key: 'all', label: '全部', icon: '🔥' },
    { key: 'food', label: '美食', icon: '🍜' },
    { key: 'drink', label: '饮品', icon: '☕' },
    { key: 'dessert', label: '甜品', icon: '🍰' },
    { key: 'market', label: '超市', icon: '🛒' },
]

const DEALS = [
    {
        id: '1', name: '招牌手工珍珠奶茶', shop: '益昌老街', rating: 4.9, sold: 2380,
        price: 3.5, orig: 7, disc: '5折', dist: '100m', cat: 'drink',
        bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
        tags: ['人气TOP1', '必喝'],
    },
    {
        id: '2', name: '叻沙海鲜套餐', shop: '328加东叻沙', rating: 4.8, sold: 1560,
        price: 6.3, orig: 9, disc: '7折', dist: '280m', cat: 'food',
        bg: 'linear-gradient(135deg, #A7F3D0, #059669)',
        tags: ['招牌菜'],
    },
    {
        id: '3', name: '正宗海南鸡饭', shop: '天天海南鸡饭', rating: 4.9, sold: 3200,
        price: 4.5, orig: 6, disc: '75折', dist: '500m', cat: 'food',
        bg: 'linear-gradient(135deg, #FECACA, #EF4444)',
        tags: ['米其林', '排队王'],
    },
    {
        id: '4', name: '手冲精品咖啡', shop: 'Brew & Co', rating: 4.7, sold: 890,
        price: 4.9, orig: 8.5, disc: '58折', dist: '350m', cat: 'drink',
        bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)',
        tags: ['精品'],
    },
    {
        id: '5', name: '全麦早餐套餐', shop: '好运来面包店', rating: 4.6, sold: 1120,
        price: 5.5, orig: 8, disc: '套餐', dist: '200m', cat: 'food',
        bg: 'linear-gradient(135deg, #FED7AA, #F97316)',
        tags: ['早餐推荐'],
    },
    {
        id: '6', name: '芒果班戟 x2', shop: '甜心小铺', rating: 4.8, sold: 670,
        price: 6.9, orig: 12, disc: '58折', dist: '420m', cat: 'dessert',
        bg: 'linear-gradient(135deg, #FBCFE8, #EC4899)',
        tags: ['网红甜品'],
    },
    {
        id: '7', name: '时令鲜果拼盘', shop: '老张水果摊', rating: 4.5, sold: 2100,
        price: 8, orig: 12, disc: '67折', dist: '300m', cat: 'market',
        bg: 'linear-gradient(135deg, #BBF7D0, #22C55E)',
        tags: ['当日鲜'],
    },
    {
        id: '8', name: '特色虾面', shop: '阿明虾面王', rating: 4.7, sold: 1890,
        price: 5, orig: 7, disc: '自取价', dist: '600m', cat: 'food',
        bg: 'linear-gradient(135deg, #BAE6FD, #0EA5E9)',
        tags: ['30年老店'],
    },
]

export default function Coupons() {
    const [cat, setCat] = useState('all')
    const [bannerIdx, setBannerIdx] = useState(0)

    const filtered = cat === 'all' ? DEALS : DEALS.filter(d => d.cat === cat)

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
                        <Text className='deals-loc-text'>📍 新加坡</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className='deals-body'>
                {/* Hero Banner */}
                <View className='hero-banner' style={{ background: BANNERS[bannerIdx].bg }}
                    onClick={() => setBannerIdx((bannerIdx + 1) % BANNERS.length)}>
                    <View className='hero-content'>
                        <Text className='hero-title'>{BANNERS[bannerIdx].title}</Text>
                        <Text className='hero-sub'>{BANNERS[bannerIdx].sub}</Text>
                    </View>
                    <View className='hero-dots'>
                        {BANNERS.map((_, i) => (
                            <View className={`hero-dot ${i === bannerIdx ? 'hero-dot-active' : ''}`} key={i} />
                        ))}
                    </View>
                </View>

                {/* Stats Bar */}
                <View className='stats-bar'>
                    <View className='stat-item'>
                        <Text className='stat-num'>128</Text>
                        <Text className='stat-label'>附近优惠</Text>
                    </View>
                    <View className='stat-divider' />
                    <View className='stat-item'>
                        <Text className='stat-num'>5.8万</Text>
                        <Text className='stat-label'>已售出</Text>
                    </View>
                    <View className='stat-divider' />
                    <View className='stat-item'>
                        <Text className='stat-num'>4.8</Text>
                        <Text className='stat-label'>平均评分</Text>
                    </View>
                </View>

                {/* Category */}
                <View className='cat-bar'>
                    {CATS.map(c => (
                        <View
                            key={c.key}
                            className={`cat-pill ${cat === c.key ? 'cat-pill-active' : ''}`}
                            onClick={() => setCat(c.key)}
                        >
                            <Text className='cat-icon'>{c.icon}</Text>
                            <Text className={`cat-label ${cat === c.key ? 'cat-label-active' : ''}`}>{c.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Deal Cards */}
                <View className='deal-list'>
                    {filtered.map((deal) => (
                        <View className='deal-card' key={deal.id} onClick={() => {
                            Taro.showModal({
                                title: `${deal.shop} · ${deal.name}`,
                                content: `⭐ ${deal.rating} · 已售${deal.sold}份\n优惠价 S$${deal.price}（原价 S$${deal.orig}）\n距离 ${deal.dist}\n\n到店出示此页面即可享受优惠`,
                                confirmText: '立即抢购',
                                cancelText: '关闭',
                                confirmColor: '#FF3C78',
                            })
                        }}>
                            {/* Image */}
                            <View className='deal-img' style={{ background: deal.bg }}>
                                <View className='deal-disc-badge'>
                                    <Text className='deal-disc-text'>{deal.disc}</Text>
                                </View>
                                <View className='deal-dist-badge'>
                                    <Text className='deal-dist-text'>📍 {deal.dist}</Text>
                                </View>
                            </View>

                            {/* Info */}
                            <View className='deal-info'>
                                <Text className='deal-name'>{deal.name}</Text>
                                <View className='deal-shop-row'>
                                    <Text className='deal-shop'>{deal.shop}</Text>
                                    <View className='deal-rating'>
                                        <Text className='deal-rating-star'>⭐</Text>
                                        <Text className='deal-rating-num'>{deal.rating}</Text>
                                    </View>
                                </View>

                                {/* Tags */}
                                <View className='deal-tags'>
                                    {deal.tags.map((tag, j) => (
                                        <View className='deal-tag' key={j}>
                                            <Text className='deal-tag-text'>{tag}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Price Row */}
                                <View className='deal-bottom'>
                                    <View className='deal-price-area'>
                                        <Text className='deal-currency'>S$</Text>
                                        <Text className='deal-price'>{deal.price.toFixed(1)}</Text>
                                        <Text className='deal-orig'>S${deal.orig}</Text>
                                    </View>
                                    <View className='deal-sold-area'>
                                        <Text className='deal-sold'>已售{deal.sold > 999 ? (deal.sold / 1000).toFixed(1) + 'k' : deal.sold}</Text>
                                    </View>
                                    <View className='deal-grab-btn'>
                                        <Text className='deal-grab-text'>抢购</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: '80px' }} />
            </ScrollView>
        </View>
    )
}
