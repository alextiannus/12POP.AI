import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useI18n } from '../../i18n'
import './index.scss'

const MOCK_ADDRESSES = [
    { id: '1', icon: '🏠', label: '家', name: 'Winston Tan', phone: '+65 9123 4567', address: 'Anson Road #20-01, International Plaza, 079903', isDefault: true },
    { id: '2', icon: '🏢', label: '公司', name: 'Winston Tan', phone: '+65 9123 4567', address: '71 Robinson Road #14-01, 068895', isDefault: false },
    { id: '3', icon: '⭐', label: '父母家', name: 'Tan Wei Ming', phone: '+65 8765 4321', address: '305 Toa Payoh Lor 4 #08-123, 310305', isDefault: false },
    { id: '4', icon: '🏫', label: '学校', name: 'Winston Tan', phone: '+65 9123 4567', address: '21 Lower Kent Ridge Rd, NUS, 119077', isDefault: false },
]

export default function Address() {
    const { t } = useI18n()

    return (
        <View className='address-page'>
            <View className='address-header'>
                <View className='status-bar' />
                <View className='sub-header-top'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>‹</View>
                    <Text className='sub-title'>{t('address_title')}</Text>
                </View>
            </View>

            <ScrollView scrollY className='address-body'>
                {MOCK_ADDRESSES.map(addr => (
                    <View className='addr-card' key={addr.id}>
                        <View className='addr-top'>
                            <View className='addr-label-box'>
                                <Text className='addr-icon'>{addr.icon}</Text>
                                <Text className='addr-label'>{addr.label}</Text>
                            </View>
                            {addr.isDefault && (
                                <View className='addr-default'>{t('default_addr')}</View>
                            )}
                        </View>
                        <Text className='addr-name'>{addr.name} · {addr.phone}</Text>
                        <Text className='addr-text'>{addr.address}</Text>
                        <View className='addr-actions'>
                            {!addr.isDefault && (
                                <Text className='addr-action'>{t('set_default')}</Text>
                            )}
                            <Text className='addr-action'>{t('edit')}</Text>
                            <Text className='addr-action delete'>{t('delete')}</Text>
                        </View>
                    </View>
                ))}

                {/* Add Button */}
                <View className='add-addr-btn'>
                    <Text className='add-icon'>＋</Text>
                    <Text className='add-text'>{t('add_address')}</Text>
                </View>

                <View style={{ height: '100px' }} />
            </ScrollView>
        </View>
    )
}
