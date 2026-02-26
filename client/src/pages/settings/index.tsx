import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useI18n, Locale } from '../../i18n'
import './index.scss'

export default function Settings() {
    const { locale, switchLocale, t } = useI18n()

    const handleLangSwitch = (lang: Locale) => {
        switchLocale(lang)
        // Show a brief toast
        Taro.showToast({
            title: lang === 'zh' ? '已切换为中文' : 'Switched to English',
            icon: 'none',
            duration: 1500,
        })
    }

    return (
        <View className='settings-page'>
            <View className='settings-header'>
                <View className='status-bar' />
                <View className='sub-header-top'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>‹</View>
                    <Text className='sub-title'>{t('settings')}</Text>
                </View>
            </View>

            <ScrollView scrollY className='settings-body'>
                {/* Language */}
                <View className='setting-section'>
                    <Text className='setting-section-title'>{t('lang_title')}</Text>
                    <View className='lang-options'>
                        <View
                            className={`lang-card ${locale === 'zh' ? 'active' : ''}`}
                            onClick={() => handleLangSwitch('zh')}
                        >
                            <Text className='lang-flag'>🇨🇳</Text>
                            <Text className='lang-name'>{t('lang_zh')}</Text>
                            <Text className='lang-sub'>简体中文</Text>
                            {locale === 'zh' && <View className='lang-check'>✓</View>}
                        </View>
                        <View
                            className={`lang-card ${locale === 'en' ? 'active' : ''}`}
                            onClick={() => handleLangSwitch('en')}
                        >
                            <Text className='lang-flag'>🇬🇧</Text>
                            <Text className='lang-name'>{t('lang_en')}</Text>
                            <Text className='lang-sub'>English</Text>
                            {locale === 'en' && <View className='lang-check'>✓</View>}
                        </View>
                    </View>
                </View>

                {/* Notifications */}
                <View className='setting-section'>
                    <Text className='setting-section-title'>{t('notification_settings').replace('🔔 ', '')}</Text>
                    <View className='setting-group'>
                        {[
                            { name: '订单状态更新', desc: '跑腿员接单、完成等通知', on: true },
                            { name: '优惠活动推送', desc: '最新折扣和优惠券', on: true },
                            { name: '系统消息', desc: '账户安全、系统维护等', on: true },
                            { name: '营销短信', desc: '促销活动短信通知', on: false },
                        ].map((item, i) => (
                            <View className='setting-item' key={i}>
                                <View className='setting-info'>
                                    <Text className='setting-name'>{item.name}</Text>
                                    <Text className='setting-desc'>{item.desc}</Text>
                                </View>
                                <View className={`toggle ${item.on ? 'on' : ''}`}>
                                    <View className='toggle-dot' />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* About */}
                <View className='setting-section'>
                    <Text className='setting-section-title'>{t('about').replace('📝 ', '')}</Text>
                    <View className='setting-group'>
                        <View className='setting-item'>
                            <Text className='setting-name'>版本</Text>
                            <Text className='setting-val'>v1.0.0</Text>
                        </View>
                        <View className='setting-item'>
                            <Text className='setting-name'>用户协议</Text>
                            <Text className='setting-arrow'>›</Text>
                        </View>
                        <View className='setting-item'>
                            <Text className='setting-name'>隐私政策</Text>
                            <Text className='setting-arrow'>›</Text>
                        </View>
                        <View className='setting-item'>
                            <Text className='setting-name'>清除缓存</Text>
                            <Text className='setting-val'>12.3 MB</Text>
                        </View>
                    </View>
                </View>

                {/* Logout */}
                <View className='logout-btn'>退出登录</View>

                <View style={{ height: '100px' }} />
            </ScrollView>
        </View>
    )
}
