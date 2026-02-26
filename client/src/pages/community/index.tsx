import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import * as api from '../../services/api'
import './index.scss'

export default function Community() {
    const [walletPoints, setWalletPoints] = useState(580)

    Taro.useDidShow(() => {
        api.getWalletBalance()
            .then(w => { setWalletPoints(w.points) })
            .catch(() => { })
    })

    const copyLink = (name: string, url: string) => {
        Taro.setClipboardData({
            data: url,
            success: () => Taro.showToast({ title: `${name}链接已复制`, icon: 'none', duration: 1800 })
        })
    }

    const groups = [
        {
            icon: '👥', name: '新加坡华人互助群',
            desc: '生活互助 · 信息分享 · 本地资讯',
            members: '2,841',
            tag: '热门', tagColor: '#E03020',
            platform: '企业微信',
            url: 'https://work.weixin.qq.com/gm/12pop-sg',
        },
        {
            icon: '🍜', name: '狮城美食交流群',
            desc: '美食推荐 · 餐厅折扣 · 外食攻略',
            members: '1,567',
            tag: '建议', tagColor: '#F59E0B',
            platform: 'Telegram',
            url: 'https://t.me/pop12sg_food',
        },
    ]

    const tasks = [
        { icon: '🚀', name: '帮邻居取快递', desc: '从快递柜取包裹送到3楼', reward: '+15', color: '#FF6B35' },
        { icon: '☕', name: '代买咖啡', desc: '帮同事买星巴克·顺路即可', reward: '+10', color: '#8B5CF6' },
        { icon: '🛒', name: '超市代购', desc: '帮忙购买日用品·附近超市', reward: '+20', color: '#06B6D4' },
        { icon: '📮', name: '寄件帮手', desc: '帮忙寄快递到附近快递点', reward: '+12', color: '#EC4899' },
    ]

    return (
        <View className='community'>
            {/* Gradient Header */}
            <View className='comm-header'>
                <View className='status-bar' />
                <Text className='header-title'>加入同城社群相互帮助</Text>
            </View>

            <ScrollView scrollY className='comm-body'>
                {/* POPCoin Hero Card */}
                <View className='popcoin-hero'>
                    <View className='popcoin-left'>
                        <View className='popcoin-badge'>
                            <View className='popcoin-icon popcoin-icon-lg'>
                                <Text className='popcoin-p'>₱</Text>
                            </View>
                        </View>
                        <View className='popcoin-info'>
                            <Text className='popcoin-amount'>{walletPoints} POPCoin</Text>
                        </View>
                    </View>
                    <Text className='popcoin-desc'>
                        Get more POPCoin rewards by joining the community and help others on requests.
                    </Text>
                </View>

                {/* Groups */}
                <View className='section'>
                    <Text className='section-title'>互助社群</Text>
                    {groups.map((g, i) => (
                        <View className='group-card' key={i}>
                            <View className='group-top'>
                                <View className='group-icon-box'>
                                    <Text className='group-icon'>{g.icon}</Text>
                                </View>
                                <View className='group-info'>
                                    <View className='group-name-row'>
                                        <Text className='group-name'>{g.name}</Text>
                                        <View className='group-tag' style={{ background: g.tagColor }}>
                                            <Text className='group-tag-text'>{g.tag}</Text>
                                        </View>
                                    </View>
                                    <Text className='group-desc'>{g.desc}</Text>
                                    <Text className='group-members'>👥 {g.members} 成员</Text>
                                </View>
                            </View>
                            <View className='join-row'>
                                <Text className='join-platform'>{g.platform}</Text>
                                <View className='join-btn' onClick={() => copyLink(g.name, g.url)}>
                                    <Text className='join-btn-text'>复制链接加入</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Earn More POPCoin — Gamified */}
                <View className='section'>
                    <View className='section-header-game'>
                        <View className='section-title-game'>
                            <View className='popcoin-icon popcoin-icon-sm'>
                                <Text className='popcoin-p'>₱</Text>
                            </View>
                            <Text>赚取更多 POPCoin</Text>
                        </View>
                        <View className='level-badge'>
                            <Text className='level-text'>Lv.3</Text>
                        </View>
                    </View>
                    {tasks.map((task, i) => (
                        <View className='quest-card' key={i}>
                            <View className='quest-icon-box' style={{ background: `linear-gradient(135deg, ${task.color}33, ${task.color}22)` }}>
                                <Text className='quest-icon'>{task.icon}</Text>
                            </View>
                            <View className='quest-info'>
                                <Text className='quest-name'>{task.name}</Text>
                                <Text className='quest-desc'>{task.desc}</Text>
                            </View>
                            <View className='quest-reward-wrap'>
                                <View className='quest-xp' style={{ background: task.color }}>
                                    <Text className='quest-xp-text'>{task.reward}</Text>
                                </View>
                                <Text className='quest-unit'>coin</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: '140px' }} />
            </ScrollView>
        </View>
    )
}
