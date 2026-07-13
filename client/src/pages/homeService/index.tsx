import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const CATEGORIES = [
    { key: 'all', label: '全部', icon: '🔥' },
    { key: 'kitchen', label: '餐饮厨具', icon: '🍳' },
    { key: 'home', label: '家居用品', icon: '🛋️' },
    { key: 'electronics', label: '电子设备', icon: '📱' },
    { key: 'fashion', label: '服饰鞋包', icon: '👗' },
    { key: 'baby', label: '母婴用品', icon: '🍼' },
    { key: 'sports', label: '运动户外', icon: '⚽' },
    { key: 'books', label: '图书文具', icon: '📚' },
    { key: 'other', label: '其他', icon: '📦' },
]

const DEMO_ITEMS = [
    { id: '1', title: '九阳豆浆机 · 9成新', price: 'S$25', orig: 'S$89', cat: 'kitchen', desc: '仅用过几次，附带原装配件', seller: 'Alice', time: '2小时前', img: '🍳', views: 42 },
    { id: '2', title: 'IKEA Billy 书柜 白色', price: 'S$40', orig: 'S$79', cat: 'home', desc: '搬家出售，自取牛车水', seller: 'Bob', time: '5小时前', img: '🛋️', views: 28 },
    { id: '3', title: 'iPhone 14 Pro 128G', price: 'S$680', orig: 'S$1299', cat: 'electronics', desc: '成色极好，电池98%，含充电器', seller: 'Charlie', time: '1天前', img: '📱', views: 156 },
    { id: '4', title: 'Nintendo Switch OLED', price: 'S$320', orig: 'S$499', cat: 'electronics', desc: '附3个游戏卡带，保护壳', seller: 'David', time: '3小时前', img: '🎮', views: 89 },
    { id: '5', title: 'Dyson V10 吸尘器', price: 'S$180', orig: 'S$499', cat: 'home', desc: '用了一年，换新出售', seller: 'Eva', time: '6小时前', img: '🧹', views: 67 },
    { id: '6', title: 'Lululemon 瑜伽垫', price: 'S$35', orig: 'S$78', cat: 'sports', desc: '5mm厚度，颜色薰衣草紫', seller: 'Fiona', time: '1天前', img: '🧘', views: 31 },
    { id: '7', title: '大量儿童绘本 打包出', price: 'S$15', orig: 'S$60', cat: 'books', desc: '约30本中英文绘本，适合2-5岁', seller: 'Grace', time: '4小时前', img: '📖', views: 44 },
    { id: '8', title: 'Zara外套 M码 全新', price: 'S$28', orig: 'S$69', cat: 'fashion', desc: '买错尺码，全新吊牌未剪', seller: 'Helen', time: '8小时前', img: '🧥', views: 22 },
]

export default function HomeService() {
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchText, setSearchText] = useState('')

    const filteredItems = DEMO_ITEMS.filter(item => {
        const matchCat = activeCategory === 'all' || item.cat === activeCategory
        const matchSearch = !searchText || item.title.includes(searchText) || item.desc.includes(searchText)
        return matchCat && matchSearch
    })

    const handlePublish = () => {
        Taro.navigateTo({ url: '/pages/itemPublish/index' })
    }

    const handleItemClick = (item: typeof DEMO_ITEMS[0]) => {
        Taro.setStorageSync('viewItem', JSON.stringify(item))
        Taro.navigateTo({ url: '/pages/itemDetail/index' })
    }

    return (
        <View className='marketplace'>
            {/* Header */}
            <View className='mp-header'>
                <View className='status-bar' />
                <View className='mp-header-row'>
                    <Text className='mp-title'>二手交易</Text>
                    <View className='mp-publish-btn' onClick={handlePublish}>
                        <Text className='mp-publish-icon'>+</Text>
                        <Text className='mp-publish-text'>发布</Text>
                    </View>
                </View>
                <View className='mp-search-bar'>
                    <Text className='mp-search-icon'>🔍</Text>
                    <Input
                      className='mp-search-input'
                      placeholder='搜索二手好物...'
                      placeholderClass='mp-search-placeholder'
                      value={searchText}
                      onInput={(e) => setSearchText(e.detail.value)}
                    />
                </View>
            </View>

            {/* Category Scroll */}
            <View className='cat-scroll-wrap'>
                <ScrollView scrollX className='cat-scroll'>
                    {CATEGORIES.map(cat => (
                        <View
                          key={cat.key}
                          className={`cat-chip ${activeCategory === cat.key ? 'cat-active' : ''}`}
                          onClick={() => setActiveCategory(cat.key)}
                        >
                            <Text className='cat-chip-icon'>{cat.icon}</Text>
                            <Text className='cat-chip-label'>{cat.label}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Listings */}
            <ScrollView scrollY className='mp-body'>
                <View className='mp-grid'>
                    {filteredItems.map(item => (
                        <View className='item-card' key={item.id} onClick={() => handleItemClick(item)}>
                            <View className='item-img-wrap'>
                                <Text className='item-img-emoji'>{item.img}</Text>
                                <View className='item-discount-tag'>
                                    <Text className='item-discount-text'>
                                        {Math.round((1 - parseFloat(item.price.replace('S$', '')) / parseFloat(item.orig.replace('S$', ''))) * 10)}折
                                    </Text>
                                </View>
                            </View>
                            <View className='item-info'>
                                <Text className='item-title'>{item.title}</Text>
                                <Text className='item-desc'>{item.desc}</Text>
                                <View className='item-bottom'>
                                    <View className='item-prices'>
                                        <Text className='item-price'>{item.price}</Text>
                                        <Text className='item-orig'>{item.orig}</Text>
                                    </View>
                                    <Text className='item-meta'>👁 {item.views}</Text>
                                </View>
                                <View className='item-seller-row'>
                                    <Text className='item-seller'>👤 {item.seller}</Text>
                                    <Text className='item-time'>{item.time}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
                {filteredItems.length === 0 && (
                    <View className='mp-empty'>
                        <Text className='mp-empty-icon'>🔍</Text>
                        <Text className='mp-empty-text'>暂无相关商品</Text>
                    </View>
                )}
                <View style={{ height: '140px' }} />
            </ScrollView>
        </View>
    )
}
