// pages/battle/battle.js
const supabase = require('../../utils/supabase.js')
const storage = require('../../utils/storage.js')
const app = getApp()

Page({
  data: {
    battleStats: { total: 0, wins: 0, losses: 0, avgTime: 0 },
    winRate: 0,
    avgTime: '00:00',
    battleRankData: []
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    // 从本地或Supabase加载对战统计
    let stats = storage.get('battle_stats')
    if (!stats) {
      stats = { total: 0, wins: 0, losses: 0, avgTime: 0 }
    }
    const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
    const avgM = Math.floor(stats.avgTime / 60)
    const avgS = stats.avgTime % 60
    this.setData({
      battleStats: stats,
      winRate,
      avgTime: String(avgM).padStart(2,'0') + ':' + String(avgS).padStart(2,'0')
    })

    // 加载排行
    let rankData = await supabase.getBattleLeaderboard()
    if (!rankData || rankData.length === 0) {
      rankData = this.getLocalRankData(stats)
    }
    this.setData({ battleRankData: rankData })
  },

  getLocalRankData(stats) {
    return [{
      nickname: app.globalData.userInfo?.nickName || '你',
      avatarUrl: '',
      wins: stats.wins,
      winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
    }]
  },

  createRoom() {
    wx.navigateTo({ url: '/pages/battle-room/battle-room?action=create' })
  },

  joinRoom() {
    wx.showModal({
      title: '加入房间',
      content: '暂未实现分享加入，后续版本将支持通过分享卡片加入房间。当前为模拟对战模式。',
      confirmText: '模拟对战',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/battle-room/battle-room?action=join' })
        }
      }
    })
  }
})
