/**
 * 12POP.AI — Frontend API Client
 * Centralized API layer for all backend communication.
 */
import Taro from '@tarojs/taro'

const BASE_URL = typeof window !== 'undefined'
    ? (window.location.port === '10086' ? 'http://localhost:3001' : '')
    : 'http://localhost:3001'

// ─── Generic request helper ───
async function request<T>(path: string, options: { method?: string; data?: any } = {}): Promise<T> {
    const url = `${BASE_URL}${path}`
    try {
        const res = await Taro.request({
            url,
            method: (options.method || 'GET') as any,
            header: { 'Content-Type': 'application/json' },
            data: options.data,
        })
        if (res.statusCode >= 400) {
            throw new Error(res.data?.error || `Request failed: ${res.statusCode}`)
        }
        return res.data as T
    } catch (err: any) {
        console.error(`API Error [${path}]:`, err)
        throw err
    }
}

// ─── User ID (demo) ───
let _userId = 'demo-user'
export function setUserId(id: string) { _userId = id }
export function getUserId() { return _userId }

// ─── Conversation API ───
export interface Conversation {
    id: string
    userId: string
    serviceType: string | null
    status: string
    slotData: Record<string, any>
    slotComplete: boolean
}

export async function createConversation(serviceType?: string): Promise<Conversation> {
    return request('/api/conversation', {
        method: 'POST',
        data: { userId: _userId, serviceType },
    })
}

export async function getConversation(id: string): Promise<Conversation> {
    return request(`/api/conversation/${id}`)
}

// SSE streaming for AI chat messages
export interface SSECallbacks {
    onText: (chunk: string) => void
    onSlots: (data: any) => void
    onSlotsComplete: (data: { serviceType: string; slotData: Record<string, any> }) => void
    onDone: () => void
    onError: (error: Error) => void
}

export function sendMessage(conversationId: string, content: string, callbacks: SSECallbacks) {
    const url = `${BASE_URL}/api/conversation/${conversationId}/messages`

    // Use fetch for SSE since Taro.request doesn't support streaming
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId: _userId }),
    })
        .then(async (response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader')

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    try {
                        const event = JSON.parse(line.slice(6))
                        switch (event.type) {
                            case 'text': callbacks.onText(event.content); break
                            case 'slots': callbacks.onSlots(event.data); break
                            case 'slots_complete': callbacks.onSlotsComplete(event); break
                            case 'done': callbacks.onDone(); break
                        }
                    } catch { /* skip malformed events */ }
                }
            }
        })
        .catch(callbacks.onError)
}

// ─── Quote API ───
export interface QuoteLineItem {
    label: string
    amount: number
    type: 'item' | 'fee' | 'budget'
}

export interface Quote {
    id: string
    serviceType: string
    lineItems: QuoteLineItem[]
    totalAmount: number
    estimatedTime: string
    currency: string
    notes: string[]
}

export async function generateQuote(serviceType: string, slotData: Record<string, any>): Promise<Quote> {
    return request('/api/quotes', {
        method: 'POST',
        data: { serviceType, slotData },
    })
}

export interface QuoteConfirmResult {
    success: boolean
    taskId: string
    status: string
    frozenAmount: number
    message: string
    wallet: WalletBalance
}

export async function confirmQuote(
    quoteId: string,
    params: { conversationId?: string; serviceType: string; slotData: Record<string, any>; totalAmount: number; tip?: number }
): Promise<QuoteConfirmResult> {
    return request(`/api/quotes/${quoteId}/confirm`, {
        method: 'POST',
        data: { userId: _userId, ...params },
    })
}

// ─── Task API ───
export interface Task {
    id: string
    userId: string
    serviceType: string
    status: string
    slotData: Record<string, any>
    totalAmount?: number
    statusHistory: Array<{ status: string; timestamp: string; data?: any }>
    createdAt: string
}

export async function getTask(taskId: string): Promise<Task> {
    return request(`/api/tasks/${taskId}`)
}

export async function getUserTasks(): Promise<Task[]> {
    return request(`/api/tasks/user/${_userId}`)
}

// ─── Wallet API ───
export interface WalletBalance {
    userId: string
    balance: number
    frozenAmount: number
    availableBalance: number
    points: number
    currency: string
}

export interface WalletTransaction {
    id: string
    type: 'freeze' | 'deduct' | 'refund' | 'topup'
    amount: number
    description: string
    balanceAfter: number
    createdAt: string
}

export async function getWalletBalance(): Promise<WalletBalance> {
    return request(`/api/wallet/${_userId}`)
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
    return request(`/api/wallet/${_userId}/transactions`)
}

export async function topUpWallet(amount: number): Promise<{ success: boolean; newBalance: number }> {
    return request('/api/wallet/topup', {
        method: 'POST',
        data: { userId: _userId, amount },
    })
}

// ─── Favorites API ───
export interface Favorite {
    id: string
    type: 'address' | 'shop'
    name: string
    data: Record<string, any>
}

export async function getFavorites(): Promise<Favorite[]> {
    return request(`/api/favorites/${_userId}`)
}

export async function addFavorite(fav: { type: string; name: string; data: any }): Promise<Favorite> {
    return request('/api/favorites', {
        method: 'POST',
        data: { userId: _userId, ...fav },
    })
}

// ─── Health Check ───
export async function healthCheck(): Promise<{ status: string }> {
    return request('/api/health')
}
