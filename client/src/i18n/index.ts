// 12POP.AI — i18n System
// Lightweight i18n with zh (default) and en

import { useState, useCallback } from 'react'
import Taro from '@tarojs/taro'

export type Locale = 'zh' | 'en'

// ── Chinese (Default) ──
const zh = {
    // Common
    app_name: '12POP',
    app_slogan: 'AI 本地生活助手',
    back: '返回',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    done: '完成',
    loading: '加载中…',
    all: '全部',
    more: '更多',

    // Tab Bar
    tab_home: '12POP',
    tab_errand: '跑腿',
    tab_service: '上门服务',
    tab_profile: '我的',

    // Home
    greeting: '早上好',
    greeting_sub: '帮你搞定每一件生活小事',
    ai_placeholder: '帮我买杯奶茶，要珍珠的…',
    wallet_balance: '钱包余额',
    coupons: '优惠券',
    points: 'POPCoin',
    select_service: '选择服务',
    errand: '跑腿',
    errand_desc: '同城取送 · 代买帮办 · 其他代办',
    city_delivery: '同城取送',
    ai_buy: 'AI代买',
    other_tasks: '其他代办',
    home_service: '上门服务',
    home_service_desc: '清洁维修\n到家安装',
    pickup_deals: '自取优惠',
    pickup_deals_desc: '附近折扣\n到店自取',
    popular: '热门',
    frequent_needs: '常用需求',
    nearby_deals: '附近自取优惠',

    // Errand
    pickup_addr: '取件地址',
    dropoff_addr: '送达地址',
    enter_dropoff: '点击输入送达地址…',
    home_addr: '回家',
    company_addr: '公司',
    parents_addr: '父母家',
    add_addr: '添加',
    note_label: '📝 备注说明',
    note_placeholder: '如: 找前台张小姐，取走A4文件袋',
    base_fee: '配送基础费',
    distance_fee: '距离费',
    platform_fee: '平台服务费（3.25%）',
    tip_label: '💰 小费（可选）',
    tip_hint: '加小费有助于更快接单和准时完成',
    tip_rule: '⏱️ 迟到即无效 — 跑腿员迟到将不会获得小费',
    tip_none: '不加',
    tip_included: '含小费',
    total: '合计',
    wallet_note_prefix: '💳  钱包余额',
    after_pay: '付款后余额',
    confirm_order: '确认下单 · 从钱包支付',
    ai_assistant: '12POP AI 代买助手',
    online: '● 在线 · 响应 <30秒',
    budget_freeze: '预算冻结\n小票核销',
    chat_placeholder: '告诉我你想买什么…',
    quote_title: '📋 代购报价单',
    about_min: '约 {0} 分钟',
    budget_frozen: '商品预算（预冻结）',
    service_fee: '代跑服务费',
    delivery_fee: '配送费',
    total_freeze: '合计冻结',
    freeze_note: '💳  从钱包预冻结',
    no_markup: '实际消费后多退少不补 · 平台不加价承诺',
    confirm_freeze: '确认并冻结',
    tracker_title: '📦 实时状态追踪',

    // Task Types
    queue_task: '排队代办',
    get_docs: '取文件',
    pay_bill: '代付账单',
    send_package: '代寄快递',
    pick_package: '代领包裹',
    ai_custom: 'AI 自定义',
    ai_describe: '用 AI 描述任何需求',
    ai_describe_sub: '告诉我你要什么，AI 来帮你安排跑腿员',
    recent_tasks: '最近的代办',

    // Home Service
    certified: '● 已认证服务商 · 全额保险',
    trust_certified: '认证服务',
    trust_rating: '4.9 评分',
    trust_insured: '全额保险',
    trust_reviews: '1,238 评价',
    select_type: '选择服务类型',
    cleaning: '上门清洁',
    repair: '家电维修',
    install: '安装组装',
    massage: '上门推拿',
    plant: '植物养护',
    ai_match: '智能匹配',
    popular_services: '热门服务',
    book: '预约',
    per_time: '/次',

    // Profile
    active_user: '🌟 活跃用户',
    quick_actions: '快捷操作',
    top_up: '充值',
    wallet: '钱包',
    coupons_available: '{0}张可用',
    favorites: '收藏',
    fav_desc: '地址/商家',
    invite: '邀请',
    earn_points: '赚 POPCoin',
    popcoin_desc: '接任务 · 邀请好友 · 活动奖励',
    recent_orders: '最近订单',
    view_all: '查看全部',
    completed: '已完成',
    in_progress: '进行中',

    // Settings
    settings: '设置',
    address_mgmt: '📍 地址管理',
    payment_settings: '💳 支付设置',
    notification_settings: '🔔 通知设置',
    language: '🌐 语言 / Language',
    help: '❓ 帮助与反馈',
    community: '👥 12POP互助社群',
    community_desc: '加入互助社群',
    community_disclaimer: '社群内为用户自行互助，平台不做任何中间人的承诺和服务',
    about: '📝 关于 12POP.AI',

    // Wallet Page
    wallet_title: '我的钱包',
    available_balance: '可用余额',
    frozen_amount: '冻结中',
    top_up_btn: '充值',
    withdraw: '提现',
    transaction_history: '交易记录',
    income: '收入',
    expense: '支出',
    no_transactions: '暂无交易记录',

    // Orders Page
    orders_title: '我的订单',
    all_orders: '全部',
    pending: '进行中',
    order_detail: '订单详情',

    // Address Page
    address_title: '地址管理',
    add_address: '添加新地址',
    default_addr: '默认',
    set_default: '设为默认',

    // Coupon Page
    coupon_title: '我的优惠券',
    available: '可使用',
    used: '已使用',
    expired: '已过期',
    use_now: '立即使用',
    valid_until: '有效期至',

    // Language
    lang_title: '语言设置',
    lang_zh: '中文',
    lang_en: 'English',
    lang_current: '当前语言',
}

// ── English ──
const en: typeof zh = {
    app_name: '12POP',
    app_slogan: 'AI Local Life Assistant',
    back: 'Back',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    loading: 'Loading…',
    all: 'All',
    more: 'More',

    tab_home: '12POP',
    tab_errand: 'Errands',
    tab_service: 'Services',
    tab_profile: 'Me',

    greeting: 'Good morning',
    greeting_sub: 'Your AI assistant for everyday life',
    ai_placeholder: 'Buy me a milk tea with pearls…',
    wallet_balance: 'Wallet',
    coupons: 'Coupons',
    points: 'POPCoin',
    select_service: 'Services',
    errand: 'Errands',
    errand_desc: 'Delivery · Shopping · Tasks',
    city_delivery: 'Delivery',
    ai_buy: 'AI Shop',
    other_tasks: 'Other',
    home_service: 'Home Service',
    home_service_desc: 'Cleaning & Repairs\nHome Installation',
    pickup_deals: 'Pickup Deals',
    pickup_deals_desc: 'Nearby Discounts\nSelf Pickup',
    popular: 'Hot',
    frequent_needs: 'Frequent Needs',
    nearby_deals: 'Nearby Pickup Deals',

    pickup_addr: 'Pickup Address',
    dropoff_addr: 'Drop-off Address',
    enter_dropoff: 'Enter drop-off address…',
    home_addr: 'Home',
    company_addr: 'Office',
    parents_addr: 'Parents',
    add_addr: 'Add',
    note_label: '📝 Notes',
    note_placeholder: 'e.g. Ask for Ms. Zhang at the front desk',
    base_fee: 'Base delivery fee',
    distance_fee: 'Distance fee',
    platform_fee: 'Platform fee (3.25%)',
    tip_label: '💰 Tip (optional)',
    tip_hint: 'Tips help get faster pickup and on-time delivery',
    tip_rule: '⏱️ No tip if late — runner loses tip for late delivery',
    tip_none: 'None',
    tip_included: 'Tip incl.',
    total: 'Total',
    wallet_note_prefix: '💳  Wallet balance',
    after_pay: 'After payment',
    confirm_order: 'Confirm · Pay from Wallet',
    ai_assistant: '12POP AI Shopping Assistant',
    online: '● Online · Response <30s',
    budget_freeze: 'Budget Freeze\nReceipt Verify',
    chat_placeholder: 'Tell me what you want to buy…',
    quote_title: '📋 Shopping Quote',
    about_min: '~{0} min',
    budget_frozen: 'Item budget (pre-frozen)',
    service_fee: 'Runner service fee',
    delivery_fee: 'Delivery fee',
    total_freeze: 'Total frozen',
    freeze_note: '💳  Pre-frozen from wallet',
    no_markup: 'Refund for overcharge · No platform markup',
    confirm_freeze: 'Confirm & Freeze',
    tracker_title: '📦 Live Status Tracking',

    queue_task: 'Queue for me',
    get_docs: 'Get Documents',
    pay_bill: 'Pay Bills',
    send_package: 'Send Package',
    pick_package: 'Pick up Parcel',
    ai_custom: 'AI Custom',
    ai_describe: 'Describe any need with AI',
    ai_describe_sub: 'Tell me what you need, AI arranges a runner',
    recent_tasks: 'Recent Tasks',

    certified: '● Certified Providers · Fully Insured',
    trust_certified: 'Certified',
    trust_rating: '4.9 Rating',
    trust_insured: 'Insured',
    trust_reviews: '1,238 Reviews',
    select_type: 'Select Service Type',
    cleaning: 'Cleaning',
    repair: 'Appliance Repair',
    install: 'Installation',
    massage: 'Massage',
    plant: 'Plant Care',
    ai_match: 'AI Match',
    popular_services: 'Popular Services',
    book: 'Book',
    per_time: '/time',

    active_user: '🌟 Active User',
    quick_actions: 'Quick Actions',
    top_up: 'Top Up',
    wallet: 'Wallet',
    coupons_available: '{0} available',
    favorites: 'Saved',
    fav_desc: 'Addresses/Shops',
    invite: 'Invite',
    earn_points: 'Earn POPCoin',
    popcoin_desc: 'Tasks · Referrals · Events',
    recent_orders: 'Recent Orders',
    view_all: 'View All',
    completed: 'Completed',
    in_progress: 'In Progress',

    settings: 'Settings',
    address_mgmt: '📍 Address',
    payment_settings: '💳 Payment',
    notification_settings: '🔔 Notifications',
    language: '🌐 Language',
    help: '❓ Help & Feedback',
    community: '👥 12POP Community',
    community_desc: 'Join mutual help group',
    community_disclaimer: 'Community is self-organized. Platform does not act as intermediary.',
    about: '📝 About 12POP.AI',

    wallet_title: 'My Wallet',
    available_balance: 'Available Balance',
    frozen_amount: 'Frozen',
    top_up_btn: 'Top Up',
    withdraw: 'Withdraw',
    transaction_history: 'Transactions',
    income: 'Income',
    expense: 'Expense',
    no_transactions: 'No transactions yet',

    orders_title: 'My Orders',
    all_orders: 'All',
    pending: 'In Progress',
    order_detail: 'Order Detail',

    address_title: 'Addresses',
    add_address: 'Add New Address',
    default_addr: 'Default',
    set_default: 'Set Default',

    coupon_title: 'My Coupons',
    available: 'Available',
    used: 'Used',
    expired: 'Expired',
    use_now: 'Use Now',
    valid_until: 'Valid until',

    lang_title: 'Language',
    lang_zh: '中文',
    lang_en: 'English',
    lang_current: 'Current',
}

const locales = { zh, en }

// Singleton state for global locale
let globalLocale: Locale = (Taro.getStorageSync('locale') as Locale) || 'zh'
const listeners: Set<(l: Locale) => void> = new Set()

export function getLocale(): Locale { return globalLocale }

export function setLocale(l: Locale) {
    globalLocale = l
    Taro.setStorageSync('locale', l)
    listeners.forEach(fn => fn(l))
}

export function t(key: keyof typeof zh, ...args: (string | number)[]): string {
    let str = locales[globalLocale][key] || locales.zh[key] || key
    args.forEach((a, i) => { str = str.replace(`{${i}}`, String(a)) })
    return str
}

export function useI18n() {
    const [locale, setL] = useState<Locale>(globalLocale)

    const switchLocale = useCallback((l: Locale) => {
        setLocale(l)
        setL(l)
    }, [])

    // Subscribe to global locale changes
    useState(() => {
        const handler = (l: Locale) => setL(l)
        listeners.add(handler)
        return () => { listeners.delete(handler) }
    })

    return { locale, switchLocale, t }
}
