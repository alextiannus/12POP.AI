import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const CATEGORIES = [
    { icon: '🧹', name: '家庭清洁', desc: '深度保洁 · 日常清扫', discount: '首单8折' },
    { icon: '🔧', name: '维修安装', desc: '水电维修 · 家具组装', discount: '满减优惠' },
    { icon: '📦', name: '搬家服务', desc: '同城搬运 · 长途搬家', discount: '新人立减' },
    { icon: '🐾', name: '宠物服务', desc: '上门喂养 · 宠物美容', discount: '9折起' },
    { icon: '👶', name: '育儿陪护', desc: '月嫂保姆 · 陪读托管', discount: '限时特价' },
    { icon: '💆', name: '美容美发', desc: '上门造型 · SPA按摩', discount: '团购价' },
]

const MERCHANTS = [
    { name: 'CleanPro 专业清洁', rating: '4.9', dist: '1.2km', tag: '深度清洁', price: 'S$68起' },
    { name: '老张维修工坊', rating: '4.8', dist: '0.8km', tag: '水电专家', price: 'S$50起' },
    { name: '小快搬家', rating: '4.7', dist: '2.5km', tag: '同城搬运', price: 'S$120起' },
    { name: 'PetCare 宠物之家', rating: '4.9', dist: '1.5km', tag: '持证上岗', price: 'S$35起' },
]

export default function LocalService() {
    return (
        <View className='ls-page'>
            {/* Header */}
            <View className='ls-header'>
                <View className='status-bar' />
                <View className='ls-header-row'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='ls-title'>上门服务</Text>
                    <View className='ls-location'>
                        <Text className='ls-loc-icon'>📍</Text>
                        <Text className='ls-loc-text'>新加坡</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className='ls-body'>
                {/* Category Grid */}
                <View className='ls-section'>
                    <Text className='ls-section-title'>服务分类</Text>
                    <View className='ls-cat-grid'>
                        {CATEGORIES.map((cat, i) => (
                            <View className='ls-cat-card' key={i}>
                                <View className='ls-cat-icon-box'>
                                    <Text className='ls-cat-icon'>{cat.icon}</Text>
                                </View>
                                <View className='ls-cat-info'>
                                    <Text className='ls-cat-name'>{cat.name}</Text>
                                    <Text className='ls-cat-desc'>{cat.desc}</Text>
                                </View>
                                <View className='ls-cat-discount'>
                                    <Text className='ls-cat-discount-text'>{cat.discount}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Merchants */}
                <View className='ls-section'>
                    <Text className='ls-section-title'>热门商家</Text>
                    {MERCHANTS.map((m, i) => (
                        <View className='ls-merchant' key={i}>
                            <View className='ls-merchant-avatar'>
                                <Text className='ls-merchant-initial'>{m.name.charAt(0)}</Text>
                            </View>
                            <View className='ls-merchant-info'>
                                <Text className='ls-merchant-name'>{m.name}</Text>
                                <View className='ls-merchant-meta'>
                                    <Text className='ls-merchant-rating'>⭐ {m.rating}</Text>
                                    <Text className='ls-merchant-dist'>{m.dist}</Text>
                                    <View className='ls-merchant-tag'>
                                        <Text className='ls-merchant-tag-text'>{m.tag}</Text>
                                    </View>
                                </View>
                            </View>
                            <Text className='ls-merchant-price'>{m.price}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: '80px' }} />
            </ScrollView>
        </View>
    )
}
