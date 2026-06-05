// pages/index/index.js
const app = getApp()
const storage = require('../../utils/storage.js')

Page({
  data: {
    userInfo: {},
    sudokuValue: { daily: 9, bonus: 0 },
    totalValue: 9,
    stageUnlock: { four: true, six: false, nine: false },
    gameProgress: {
      four: { passed: 0, consecutiveCount: 0 },
      six: { passed: 0, consecutiveCount: 0 },
      nine: { passed: 0, consecutiveCount: 0 }
    }
  },

  onShow() {
    this.refreshData()
  },

  refreshData() {
    const g = app.globalData
    this.setData({
      userInfo: g.userInfo || {},
      sudokuValue: g.sudokuValue,
      totalValue: app.getTotalSudokuValue(),
      stageUnlock: g.stageUnlock,
      gameProgress: g.gameProgress
    })
  },

  // 选择阶段进入游戏
  selectStage(e) {
    const stage = e.currentTarget.dataset.stage
    // 检查是否已解锁
    if (!app.globalData.stageUnlock[stage]) {
      wx.showToast({ title: '该阶段尚未解锁', icon: 'none' })
      return
    }
    // 检查数独值
    if (app.getTotalSudokuValue() < 1) {
      wx.showModal({
        title: '数独值不足',
        content: '当前数独值不足，可以通过分享或观看广告获取更多数独值。',
        confirmText: '去获取',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 引导分享
          }
        }
      })
      return
    }
    // 消耗数独值
    app.consumeSudokuValue(1)
    wx.navigateTo({
      url: '/pages/game/game?stage=' + stage
    })
  },

  // 分享游戏
  handleShare() {
    // 微信分享由 onShareAppMessage 处理
    wx.showToast({ title: '请点击右上角分享', icon: 'none' })
  },

  // 观看广告（模拟）
  handleWatchAd() {
    wx.showModal({
      title: '观看广告',
      content: '观看一段广告后可获得3个数独值',
      confirmText: '观看',
      success: (res) => {
        if (res.confirm) {
          app.addSudokuValue(3, 'bonus')
          this.refreshData()
          wx.showToast({ title: '获得3个数独值!', icon: 'success' })
        }
      }
    })
  },

  goToLeaderboard() {
    wx.navigateTo({ url: '/pages/leaderboard/leaderboard' })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  goToBattle() {
    // 检查九宫是否解锁
    if (!app.globalData.stageUnlock.nine) {
      wx.showToast({ title: '需解锁九宫阶段才能对战', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/battle/battle' })
  },

  onShareAppMessage() {
    app.addSudokuValue(3, 'bonus')
    this.refreshData()
    return {
      title: '来玩数独小游戏吧！',
      path: '/pages/index/index'
    }
  }
})
