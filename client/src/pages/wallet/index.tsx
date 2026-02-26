import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n'
import * as api from '../../services/api'
import './index.scss'

// Icon mapping for transaction types
function txIcon(desc: string): string {
    if (desc.includes('奶茶') || desc.includes('代买')) return '🧋'
    if (desc.includes('取送') || desc.includes('配送')) return '📦'
    if (desc.includes('充值')) return '💰'
    if (desc.includes('清洁')) return '🧹'
    if (desc.includes('退款')) return '🔙'
    if (desc.includes('文件')) return '📋'
    if (desc.includes('冻结')) return '🔒'
    return '💳'
}

function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime()
    const hours = diff / 3600000
    if (hours < 1) return '刚刚'
    if (hours < 24) return '今天'
    if (hours < 48) return '昨天'
    if (hours < 72) return '前天'
    return `${Math.floor(hours / 24)}天前`
}

export default function Wallet() {
    const { t } = useI18n()
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
    const [balance, setBalance] = useState({ balance: 24.50, frozenAmount: 0, availableBalance: 24.50, points: 580 })
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [walletData, txnData] = await Promise.all([
                api.getWalletBalance(),
                api.getWalletTransactions(),
            ])
            setBalance({
                balance: walletData.balance,
                frozenAmount: walletData.frozenAmount,
                availableBalance: walletData.availableBalance,
                points: walletData.points,
            })
            setTransactions(txnData.map(tx => ({
                id: tx.id,
                type: tx.amount > 0 ? 'income' : 'expense',
                icon: txIcon(tx.description),
                name: tx.description,
                amount: tx.amount,
                time: timeAgo(tx.createdAt),
                status: tx.type === 'topup' ? '已到账' : tx.type === 'refund' ? '已到账' : tx.type === 'freeze' ? '已冻结' : '已完成',
            })))
        } catch {
            // Keep default mock data
            setTransactions([
                { id: '1', type: 'expense', icon: '🧋', name: '益昌老街 · 奶茶代买', amount: -8.50, time: '今天', status: '已完成' },
                { id: '2', type: 'expense', icon: '📦', name: '公司 → 家 取送', amount: -8.00, time: '昨天', status: '已完成' },
                { id: '3', type: 'income', icon: '💰', name: '钱包充值', amount: 50.00, time: '前天', status: '已到账' },
            ])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])
    useDidShow(() => { fetchData() }) // refresh on navigate back

    const handleTopUp = () => {
        Taro.showModal({
            title: '充值',
            content: '选择充值金额',
            confirmText: 'S$50',
            confirmColor: '#6B2FE0',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.topUpWallet(50)
                        Taro.showToast({ title: '充值成功！', icon: 'success' })
                        fetchData()
                    } catch {
                        Taro.showToast({ title: '充值失败', icon: 'none' })
                    }
                }
            }
        })
    }

    const filtered = filter === 'all'
        ? transactions
        : transactions.filter(tx => tx.type === filter)

    return (
        <View className='wallet-page'>
            <View className='wallet-header'>
                <View className='status-bar' />
                <View className='sub-header-top'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>‹</View>
                    <Text className='sub-title'>{t('wallet_title')}</Text>
                </View>

                {/* Balance Card */}
                <View className='balance-card'>
                    <Text className='balance-label'>{t('available_balance')}</Text>
                    <Text className='balance-value'>S${balance.availableBalance.toFixed(2)}</Text>
                    <View className='balance-row'>
                        <View className='balance-sub'>
                            <Text className='sub-label'>{t('frozen_amount')}</Text>
                            <Text className='sub-value'>S${balance.frozenAmount.toFixed(2)}</Text>
                        </View>
                        <View className='balance-sub'>
                            <Text className='sub-label'>{t('points')}</Text>
                            <Text className='sub-value'>{balance.points}</Text>
                        </View>
                    </View>
                    <View className='balance-actions'>
                        <View className='action-btn primary' onClick={handleTopUp}>{t('top_up_btn')}</View>
                        <View className='action-btn secondary'>{t('withdraw')}</View>
                    </View>
                </View>
            </View>

            <View className='tx-body'>
                <View className='tx-header'>
                    <Text className='tx-title'>{t('transaction_history')}</Text>
                    <View className='tx-filters'>
                        {(['all', 'income', 'expense'] as const).map(f => (
                            <Text
                                key={f}
                                className={`tx-filter ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? t('all') : f === 'income' ? t('income') : t('expense')}
                            </Text>
                        ))}
                    </View>
                </View>

                <ScrollView scrollY className='tx-list'>
                    {loading && <Text className='tx-loading'>加载中...</Text>}
                    {!loading && filtered.map(tx => (
                        <View className='tx-item' key={tx.id}>
                            <View className='tx-icon-box'>
                                <Text className='tx-icon'>{tx.icon}</Text>
                            </View>
                            <View className='tx-info'>
                                <Text className='tx-name'>{tx.name}</Text>
                                <Text className='tx-time'>{tx.time}</Text>
                            </View>
                            <View className='tx-right'>
                                <Text className={`tx-amount ${tx.type}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                </Text>
                                <Text className='tx-status'>{tx.status}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}
