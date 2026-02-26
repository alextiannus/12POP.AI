import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const CATS = [
    { icon: '🍜', label: '单人\n工作餐' },
    { icon: '👫', label: '双人\n工作餐' },
    { icon: '👨‍👩‍👧‍👦', label: '四人\n工作餐' },
    { icon: '🥘', label: '双人\n小聚' },
    { icon: '🎉', label: '四人\n小聚' },
    { icon: '🎊', label: '六人\n小聚' },
    { icon: '🏢', label: '六人\n商务' },
    { icon: '☕', label: '下午茶' },
]

const SORTS = ['综合排序', '销量优先', '距离最近', '价格最低']

const DEALS = [
    {
        id: '1', title: '舌尖尖兰州牛肉面（chinatown point店）',
        sub: '【面条+串串+饮料】套餐', desc: '串串和面条就是经典搭配！',
        shop: '舌尖尖兰州牛肉面（chinat...', rating: 3.8, dist: '8.58km',
        price: 15.9, orig: 20.25, disc: '7.9折', sold: '4000+',
        emoji: '🍜',
    },
    {
        id: '2', title: '正南柒百 重庆米线·中式糖水（313）',
        sub: '【米线+糖水】正南柒佰...', desc: '性价比高！',
        shop: '正南柒百 重庆米线·中式糖...', rating: 4.2, dist: '6.96km',
        price: 16.8, orig: 21.4, disc: '7.9折', sold: '3000+',
        emoji: '🥘',
    },
    {
        id: '3', title: '正南柒百 重庆米线·中式糖水（313）',
        sub: '正南柒佰重庆米线豪华米...', desc: '米线满满一大碗，甜品也美味',
        shop: '正南柒百 重庆米线·中式糖...', rating: 3.8, dist: '6.96km',
        price: 11.0, orig: 22, disc: '5折', sold: '1000+',
        emoji: '🍲',
    },
    {
        id: '4', title: '舌尖尖兰州牛肉面（chinatown point店）',
        sub: '【小菜组合】舌尖尖单...', desc: '一个人吃得饱饱的',
        shop: '舌尖尖兰州牛肉面（chinat...', rating: 3.9, dist: '8.58km',
        price: 12.9, orig: 17.5, disc: '7.4折', sold: '1000+',
        emoji: '🥡',
    },
    {
        id: '5', title: '益昌老街 招牌手工珍珠奶茶',
        sub: '【奶茶+小食】人气套餐', desc: '点评人气TOP1！',
        shop: '益昌老街（牛车水店）', rating: 4.5, dist: '100m',
        price: 3.5, orig: 7.0, disc: '5折', sold: '2380+',
        emoji: '🧋',
    },
    {
        id: '6', title: '天天海南鸡饭 经典白鸡套餐',
        sub: '【鸡饭+汤+饮品】', desc: '米其林排队王',
        shop: '天天海南鸡饭', rating: 4.9, dist: '500m',
        price: 4.5, orig: 6.0, disc: '75折', sold: '3200+',
        emoji: '🍗',
    },
    {
        id: '7', title: '甜心小铺 芒果班戟双人套餐',
        sub: '【班戟x2+饮品x2】', desc: '网红甜品打卡地',
        shop: '甜心小铺', rating: 4.8, dist: '420m',
        price: 6.9, orig: 12.0, disc: '58折', sold: '670+',
        emoji: '🍰',
    },
    {
        id: '8', title: '阿明虾面王 招牌特色虾面',
        sub: '【虾面+小菜+饮料】', desc: '30年老店传承',
        shop: '阿明虾面王', rating: 4.7, dist: '600m',
        price: 5.0, orig: 7.0, disc: '自取价', sold: '1890+',
        emoji: '🦐',
    },
]

export default function Coupons() {
    const [activeCat, setActiveCat] = useState(0)
    const [activeSort, setActiveSort] = useState(0)
    const [showSorts, setShowSorts] = useState(false)
    const [searchVal, setSearchVal] = useState('')

    return (
        <View className='tg-page'>
            {/* Header */}
            <View className='tg-header'>
                <View className='status-bar' />
                <View className='tg-header-row'>
                    <View className='tg-back' onClick={() => Taro.navigateBack()}>
                        <Text className='tg-back-icon'>‹</Text>
                    </View>
                    <Text className='tg-header-title'>团购</Text>
                    <View style={{ width: '50px' }} />
                </View>
            </View>

            <ScrollView scrollY className='tg-body'>
                {/* Search */}
                <View className='tg-search'>
                    <Text className='tg-search-icon'>🔍</Text>
                    <Input
                        className='tg-search-input'
                        placeholder='搜索美食、店铺'
                        placeholderClass='tg-search-ph'
                        value={searchVal}
                        onInput={(e) => setSearchVal(e.detail.value)}
                    />
                    <Text className='tg-search-btn'>搜索</Text>
                </View>

                {/* Categories */}
                <ScrollView scrollX className='tg-cats'>
                    {CATS.map((cat, i) => (
                        <View
                            className={`tg-cat ${activeCat === i ? 'tg-cat-active' : ''}`}
                            key={i}
                            onClick={() => setActiveCat(i)}
                        >
                            <View className={`tg-cat-icon-wrap ${activeCat === i ? 'tg-cat-icon-active' : ''}`}>
                                <Text className='tg-cat-icon'>{cat.icon}</Text>
                            </View>
                            <Text className={`tg-cat-label ${activeCat === i ? 'tg-cat-label-active' : ''}`}>{cat.label}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Sort Bar */}
                <View className='tg-sort-bar' onClick={() => setShowSorts(!showSorts)}>
                    <Text className='tg-sort-text'>{SORTS[activeSort]} ▾</Text>
                </View>
                {showSorts && (
                    <View className='tg-sort-dropdown'>
                        {SORTS.map((s, i) => (
                            <View className={`tg-sort-item ${activeSort === i ? 'tg-sort-item-active' : ''}`}
                                key={i} onClick={() => { setActiveSort(i); setShowSorts(false) }}>
                                <Text className='tg-sort-item-text'>{s}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Deal List */}
                <View className='tg-deals'>
                    {DEALS.map((deal) => (
                        <View className='tg-deal' key={deal.id} onClick={() => {
                            Taro.showModal({
                                title: deal.title,
                                content: `${deal.sub}\n⭐ ${deal.rating} · ${deal.dist}\n\n团购价 S$${deal.price.toFixed(2)}（原价 S$${deal.orig.toFixed(2)}）\n已售${deal.sold}\n\n到店出示即享优惠`,
                                confirmText: '立即抢购',
                                confirmColor: '#FF6B00',
                            })
                        }}>
                            {/* Left Image */}
                            <View className='tg-deal-img'>
                                <Text className='tg-deal-emoji'>{deal.emoji}</Text>
                            </View>

                            {/* Right Info */}
                            <View className='tg-deal-info'>
                                <Text className='tg-deal-title'>{deal.title}</Text>
                                <Text className='tg-deal-sub'>{deal.desc}</Text>
                                <View className='tg-deal-meta'>
                                    <Text className='tg-deal-rating'>⭐ {deal.rating}</Text>
                                    <Text className='tg-deal-sep'>|</Text>
                                    <Text className='tg-deal-shop'>{deal.shop}</Text>
                                    <Text className='tg-deal-dist'>{deal.dist}</Text>
                                </View>
                                <Text className='tg-deal-sold'>已售{deal.sold}</Text>

                                {/* Price Row */}
                                <View className='tg-deal-price-row'>
                                    <View className='tg-price-left'>
                                        <Text className='tg-price-dollar'>$</Text>
                                        <Text className='tg-price-num'>{deal.price < 10 ? deal.price.toFixed(1) : deal.price.toFixed(deal.price % 1 === 0 ? 0 : 1)}</Text>
                                        <View className='tg-disc-badge'>
                                            <Text className='tg-disc-text'>{deal.disc}</Text>
                                        </View>
                                        <Text className='tg-price-orig'>S${deal.orig.toFixed(deal.orig % 1 === 0 ? 0 : 2)}</Text>
                                    </View>
                                    <View className='tg-deal-label'>
                                        <Text className='tg-deal-label-text'>团购价</Text>
                                    </View>
                                    <View className='tg-grab'>
                                        <Text className='tg-grab-text'>抢</Text>
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
