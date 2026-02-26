import Taro from '@tarojs/taro'

export interface Order {
    id: string
    service: string
    from: string
    to: string
    budget: number
    fee: number
    platformFee: number
    tip: number
    total: number
    type: 'errand' | 'onsite' | 'delivery'
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
    statusText: string
    icon: string
    createdAt: string
    runner?: string
}

const STORAGE_KEY = 'activeOrders'

export function getOrders(): Order[] {
    try {
        const raw = Taro.getStorageSync(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function saveOrder(order: Order) {
    const orders = getOrders()
    orders.unshift(order)
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(orders))
}

export function getActiveOrders(): Order[] {
    return getOrders().filter(o => o.status !== 'completed' && o.status !== 'cancelled')
}

export function updateOrderStatus(id: string, status: Order['status'], statusText: string, runner?: string) {
    const orders = getOrders()
    const order = orders.find(o => o.id === id)
    if (order) {
        order.status = status
        order.statusText = statusText
        if (runner) order.runner = runner
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(orders))
    }
}

export function generateOrderId(): string {
    const d = new Date()
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    return `ORD-${date}-${rand}`
}
