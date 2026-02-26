export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/homeService/index',
    'pages/aiAssistant/index',
    'pages/community/index',
    'pages/profile/index',
    'pages/errand/index',
    'pages/wallet/index',
    'pages/orders/index',
    'pages/coupons/index',
    'pages/address/index',
    'pages/settings/index',
    'pages/itemDetail/index',
    'pages/itemPublish/index',
    'pages/localService/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6B2FE0',
    navigationBarTitleText: '12POP.AI',
    navigationBarTextStyle: 'white',
    navigationStyle: 'custom'
  },
  tabBar: {
    custom: true,
    color: '#B5A090',
    selectedColor: '#6B2FE0',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '12POP'
      },
      {
        pagePath: 'pages/homeService/index',
        text: '二手交易'
      },
      {
        pagePath: 'pages/aiAssistant/index',
        text: 'AI助手'
      },
      {
        pagePath: 'pages/community/index',
        text: '同城社群'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
