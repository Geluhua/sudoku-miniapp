// pages/login/login.js
const app = getApp()
const storage = require('../../utils/storage.js')

Page({
  data: {
    loading: false,
    logoNums: [1,2,3,0, 3,0,1,2, 0,3,2,1, 2,1,0,3]
  },

  handleLogin(e) {
    this.setData({ loading: true })
    wx.getUserProfile({
      desc: '用于显示用户信息',
      success: (res) => {
        const userInfo = res.userInfo
        this.doLogin(userInfo)
      },
      fail: (err) => {
        console.log('登录取消:', err)
        this.setData({ loading: false })
        // 取消授权时使用游客模式
        this.doGuestLogin()
      }
    })
  },

  doLogin(userInfo) {
    wx.login({
      success: (loginRes) => {
        // 实际项目中在此处调用后端接口换取 openid
        const openid = 'test_' + Date.now()
        app.globalData.userInfo = userInfo
        app.globalData.openid = openid
        storage.set('userInfo', userInfo)
        storage.set('openid', openid)
        this.setData({ loading: false })
        wx.redirectTo({ url: '/pages/index/index' })
      },
      fail: () => {
        this.setData({ loading: false })
        this.doGuestLogin()
      }
    })
  },

  handleGuestLogin() {
    this.doGuestLogin()
  },

  doGuestLogin() {
    const userInfo = {
      nickName: '游客' + Math.random().toString(36).slice(2, 7),
      avatarUrl: ''
    }
    const openid = 'guest_' + Date.now()
    app.globalData.userInfo = userInfo
    app.globalData.openid = openid
    storage.set('userInfo', userInfo)
    storage.set('openid', openid)
    wx.redirectTo({ url: '/pages/index/index' })
  }
})

