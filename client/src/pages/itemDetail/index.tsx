import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

interface ItemData {
    id: string
    title: string
    price: string
    orig: string
    cat: string
    desc: string
    seller: string
    time: string
    img: string
    views: number
}

const CAT_LABELS: Record<string, string> = {
    kitchen: '餐饮厨具', home: '家居用品', electronics: '电子设备',
    fashion: '服饰鞋包', baby: '母婴用品', sports: '运动户外',
    books: '图书文具', other: '其他',
}

export default function ItemDetail() {
    const [item, setItem] = useState<ItemData | null>(null)

    useEffect(() => {
        const raw = Taro.getStorageSync('viewItem')
        if (raw) {
            try { setItem(JSON.parse(raw)) } catch { /* */ }
        }
    }, [])

    if (!item) {
        return (
            <View className='detail-page'>
                <View className='detail-header'>
                    <View className='status-bar' />
                    <View className='detail-nav'>
                        <View className='back-btn' onClick={() => Taro.navigateBack()}>
                            <Text className='back-arrow'>←</Text>
                        </View>
                        <Text className='nav-title'>商品详情</Text>
                        <View style={{ width: '60px' }} />
                    </View>
                </View>
                <View className='detail-loading'>
                    <Text>加载中...</Text>
                </View>
            </View>
        )
    }

    const discount = Math.round(
        (1 - parseFloat(item.price.replace('S$', '')) / parseFloat(item.orig.replace('S$', ''))) * 100
    )

    const handleContact = () => {
        Taro.showModal({
            title: '联系卖家',
            content: `卖家 ${item.seller} 的联系方式已复制到剪贴板。\n\n请通过 WhatsApp 或 Telegram 联系卖家完成交易。`,
            confirmText: '好的',
            showCancel: false,
        })
    }

    const handleShare = () => {
        Taro.showToast({ title: '已复制分享链接', icon: 'none' })
    }

    return (
        <View className='detail-page'>
            {/* Header */}
            <View className='detail-header'>
                <View className='status-bar' />
                <View className='detail-nav'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='nav-title'>商品详情</Text>
                    <View className='share-btn' onClick={handleShare}>
                        <Text className='share-icon'>↗</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className='detail-body'>
                {/* Image Gallery */}
                <View className='detail-gallery'>
                    <Text className='gallery-emoji'>{item.img}</Text>
                    <View className='gallery-badge'>
                        <Text className='gallery-badge-text'>省{discount}%</Text>
                    </View>
                </View>

                {/* Price Section */}
                <View className='price-section'>
                    <View className='price-row'>
                        <Text className='detail-price'>{item.price}</Text>
                        <Text className='detail-orig'>{item.orig}</Text>
                    </View>
                    <View className='price-tags'>
                        <View className='p-tag p-tag-red'>
                            <Text className='p-tag-text'>省{discount}%</Text>
                        </View>
                        <View className='p-tag p-tag-blue'>
                            <Text className='p-tag-text'>{CAT_LABELS[item.cat] || '其他'}</Text>
                        </View>
                    </View>
                </View>

                {/* Title & Desc */}
                <View className='info-card'>
                    <Text className='detail-title'>{item.title}</Text>
                    <Text className='detail-desc'>{item.desc}</Text>
                    <View className='detail-meta-row'>
                        <Text className='detail-meta'>👁 {item.views} 浏览</Text>
                        <Text className='detail-meta'>📍 {item.time}</Text>
                    </View>
                </View>

                {/* Seller Card */}
                <View className='seller-card'>
                    <View className='seller-left'>
                        <View className='seller-avatar'>
                            <Text className='seller-avatar-text'>{item.seller.charAt(0)}</Text>
                        </View>
                        <View className='seller-info'>
                            <Text className='seller-name'>{item.seller}</Text>
                            <Text className='seller-stat'>在售 3 件 · 好评率 98%</Text>
                        </View>
                    </View>
                    <View className='seller-follow'>
                        <Text className='seller-follow-text'>关注</Text>
                    </View>
                </View>

                {/* Safety Tips */}
                <View className='safety-card'>
                    <Text className='safety-title'>🛡️ 交易安全提示</Text>
                    <Text className='safety-text'>• 建议当面验货交易</Text>
                    <Text className='safety-text'>• 请勿提前转账，谨防诈骗</Text>
                    <Text className='safety-text'>• 贵重物品请选择安全的交易地点</Text>
                </View>

                <View style={{ height: '180px' }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className='detail-action-bar'>
                <View className='action-btns'>
                    <View className='action-icon-btn'>
                        <Text className='action-icon-emoji'>💬</Text>
                        <Text className='action-icon-label'>聊天</Text>
                    </View>
                    <View className='action-icon-btn'>
                        <Text className='action-icon-emoji'>❤️</Text>
                        <Text className='action-icon-label'>收藏</Text>
                    </View>
                </View>
                <View className='contact-btn' onClick={handleContact}>
                    <Text className='contact-btn-text'>联系卖家</Text>
                </View>
            </View>
        </View>
    )
}
