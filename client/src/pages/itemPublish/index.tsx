import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const CATEGORIES = [
    { key: 'kitchen', label: '餐饮厨具', icon: '🍳' },
    { key: 'home', label: '家居用品', icon: '🛋️' },
    { key: 'electronics', label: '电子设备', icon: '📱' },
    { key: 'fashion', label: '服饰鞋包', icon: '👗' },
    { key: 'baby', label: '母婴用品', icon: '🍼' },
    { key: 'sports', label: '运动户外', icon: '⚽' },
    { key: 'books', label: '图书文具', icon: '📚' },
    { key: 'other', label: '其他', icon: '📦' },
]

const CONDITIONS = [
    { key: 'new', label: '全新' },
    { key: 'like-new', label: '几乎全新' },
    { key: 'good', label: '成色较好' },
    { key: 'fair', label: '有使用痕迹' },
]

export default function ItemPublish() {
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [price, setPrice] = useState('')
    const [origPrice, setOrigPrice] = useState('')
    const [category, setCategory] = useState('')
    const [condition, setCondition] = useState('')
    const [photos, setPhotos] = useState<string[]>([])

    const handleAddPhoto = () => {
        // In real app: Taro.chooseImage
        Taro.showToast({ title: '已添加示例图片', icon: 'none' })
        setPhotos(prev => [...prev, `📷${prev.length + 1}`])
    }

    const handleSubmit = () => {
        if (!title.trim()) {
            Taro.showToast({ title: '请输入商品标题', icon: 'none' }); return
        }
        if (!price.trim()) {
            Taro.showToast({ title: '请输入售价', icon: 'none' }); return
        }
        if (!category) {
            Taro.showToast({ title: '请选择分类', icon: 'none' }); return
        }
        Taro.showModal({
            title: '发布成功 🎉',
            content: `您的商品「${title}」已成功发布！\n其他用户将在二手交易页面看到您的商品。`,
            showCancel: false,
            confirmText: '好的',
            success: () => {
                Taro.navigateBack()
            },
        })
    }

    return (
        <View className='publish-page'>
            {/* Header */}
            <View className='pub-header'>
                <View className='status-bar' />
                <View className='pub-nav'>
                    <View className='back-btn' onClick={() => Taro.navigateBack()}>
                        <Text className='back-arrow'>←</Text>
                    </View>
                    <Text className='nav-title'>发布商品</Text>
                    <View style={{ width: '60px' }} />
                </View>
            </View>

            {/* Form Body */}
            <View className='pub-body'>
                {/* Photos */}
                <View className='form-section'>
                    <Text className='form-label'>商品图片</Text>
                    <View className='photo-grid'>
                        {photos.map((p, i) => (
                            <View className='photo-item' key={i}>
                                <Text className='photo-emoji'>{p}</Text>
                            </View>
                        ))}
                        {photos.length < 9 && (
                            <View className='photo-add' onClick={handleAddPhoto}>
                                <Text className='photo-add-icon'>+</Text>
                                <Text className='photo-add-text'>{photos.length}/9</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Title */}
                <View className='form-section'>
                    <Text className='form-label'>商品标题</Text>
                    <Input
                        className='form-input'
                        placeholder='描述您的商品，如品牌、型号、新旧程度'
                        placeholderClass='form-placeholder'
                        value={title}
                        onInput={(e) => setTitle(e.detail.value)}
                        maxlength={50}
                    />
                </View>

                {/* Description */}
                <View className='form-section'>
                    <Text className='form-label'>详细描述</Text>
                    <Textarea
                        className='form-textarea'
                        placeholder='描述商品的使用情况、购买时间、是否有缺陷等...'
                        placeholderClass='form-placeholder'
                        value={desc}
                        onInput={(e) => setDesc(e.detail.value)}
                        maxlength={500}
                    />
                </View>

                {/* Category */}
                <View className='form-section'>
                    <Text className='form-label'>商品分类</Text>
                    <View className='cat-picker'>
                        {CATEGORIES.map(cat => (
                            <View
                                key={cat.key}
                                className={`cat-option ${category === cat.key ? 'cat-selected' : ''}`}
                                onClick={() => setCategory(cat.key)}
                            >
                                <Text className='cat-option-icon'>{cat.icon}</Text>
                                <Text className='cat-option-label'>{cat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Condition */}
                <View className='form-section'>
                    <Text className='form-label'>商品成色</Text>
                    <View className='cond-row'>
                        {CONDITIONS.map(c => (
                            <View
                                key={c.key}
                                className={`cond-option ${condition === c.key ? 'cond-selected' : ''}`}
                                onClick={() => setCondition(c.key)}
                            >
                                <Text className='cond-label'>{c.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Price */}
                <View className='form-section'>
                    <Text className='form-label'>价格</Text>
                    <View className='price-inputs'>
                        <View className='price-field'>
                            <Text className='price-prefix'>S$</Text>
                            <Input
                                className='price-input'
                                placeholder='售价'
                                placeholderClass='form-placeholder'
                                type='digit'
                                value={price}
                                onInput={(e) => setPrice(e.detail.value)}
                            />
                        </View>
                        <View className='price-field price-field-light'>
                            <Text className='price-prefix-light'>S$</Text>
                            <Input
                                className='price-input'
                                placeholder='原价（选填）'
                                placeholderClass='form-placeholder'
                                type='digit'
                                value={origPrice}
                                onInput={(e) => setOrigPrice(e.detail.value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Submit */}
                <View className='pub-submit' onClick={handleSubmit}>
                    <Text className='pub-submit-text'>发布商品</Text>
                </View>

                <View style={{ height: '80px' }} />
            </View>
        </View>
    )
}
