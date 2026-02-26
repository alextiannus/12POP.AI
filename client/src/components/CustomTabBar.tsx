import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './customTabBar.scss'

const TAB_PATHS = [
    'pages/home/index',
    'pages/homeService/index',
    'pages/aiAssistant/index',
    'pages/community/index',
    'pages/profile/index',
]

export default function CustomTabBar() {
    const [activeTab, setActiveTab] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    const tabs = [
        { key: 'home', label: '12POP', icon: '🌟', url: '/pages/home/index' },
        { key: 'homeService', label: '二手交易', icon: '🏷️', url: '/pages/homeService/index' },
        { key: 'aiAssistant', label: 'AI助手', icon: '✨', url: '/pages/aiAssistant/index', isCenter: true },
        { key: 'community', label: '同城社群', icon: '👥', url: '/pages/community/index' },
        { key: 'profile', label: '我的', icon: '👤', url: '/pages/profile/index' },
    ]

    useEffect(() => {
        const checkRoute = () => {
            // Try Taro API first
            let currentPath = ''
            try {
                const pages = Taro.getCurrentPages()
                if (pages.length > 0) {
                    currentPath = pages[pages.length - 1].route || ''
                }
            } catch { /* ignore */ }

            // H5 fallback: check window.location
            if (!currentPath && typeof window !== 'undefined') {
                const hash = window.location.hash || ''  // e.g. #/pages/home/index
                const pathname = window.location.pathname || ''
                currentPath = hash.replace(/^#\/?/, '') || pathname.replace(/^\//, '')
            }

            // Normalize: strip leading slash
            currentPath = currentPath.replace(/^\//, '')

            const index = TAB_PATHS.findIndex(p => currentPath.includes(p))
            if (index > -1) {
                setActiveTab(prev => prev !== index ? index : prev)
                setIsVisible(true)
            } else {
                // If we can't detect a route at all, still show the tab bar
                // (better to show it than hide it)
                if (!currentPath) {
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                }
            }
        }
        checkRoute()
        const timer = setInterval(checkRoute, 300)
        return () => clearInterval(timer)
    }, [])

    const switchTab = (index: number, url: string) => {
        setActiveTab(index)
        Taro.switchTab({ url })
    }

    if (!isVisible) return null

    return (
        <View className='custom-tab-bar'>
            {tabs.map((tab, index) => {
                const isActive = activeTab === index
                return (
                    <View
                        key={tab.key}
                        className={`tab-item ${isActive ? 'active' : ''} ${tab.isCenter ? 'center-tab' : ''}`}
                        onClick={() => switchTab(index, tab.url)}
                    >
                        {tab.isCenter ? (
                            <View className='center-btn-wrap'>
                                <View className='center-btn'>
                                    <Text className='center-icon'>{tab.icon}</Text>
                                </View>
                                <Text className='tab-label'>{tab.label}</Text>
                            </View>
                        ) : (
                            <View>
                                <View className='tab-icon-wrap'>
                                    <Text className='tab-icon'>{tab.icon}</Text>
                                    <View className='active-dot' />
                                </View>
                                <Text className='tab-label'>{tab.label}</Text>
                            </View>
                        )}
                    </View>
                )
            })}
        </View>
    )
}
