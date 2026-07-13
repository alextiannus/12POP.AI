import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import CustomTabBar from './custom-tab-bar/index'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return (
    <>
    { children }
    < CustomTabBar />
    </>
  )
}

export default App
