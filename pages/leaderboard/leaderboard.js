// pages/leaderboard/leaderboard.js
const supabase = require('../../utils/supabase.js')
const storage = require('../../utils/storage.js')

Page({
  data: {
    currentTab: 'clear',
    loading: false,
    rankedData: []
  },

  onShow() {
    this.loadData()
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab })
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const tab = this.data.currentTab
      let data = []
      if (tab === 'clear') {
        // 尝试从Supabase加载
        data = await supabase.getClearLeaderboard()
        // 如果Supabase不可用，从本地加载
        if (!data || data.length === 0) {
          data = this.getLocalClearData()
        }
      } else {
        const stageMap = { four: 'four', six: 'six', nine: 'nine' }
        data = await supabase.getStageTimeLeaderboard(stageMap[tab])
        if (!data || data.length === 0) {
          data = this.getLocalStageData(tab)
        }
      }
      this.setData({ rankedData: data, loading: false })
    } catch (e) {
      console.error('加载排行榜失败:', e)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  },

  // 本地模拟数据
  getLocalClearData() {
    const records = storage.get('game_records') || []
    const passed = records.filter(r => r.passed)
    const totalTime = passed.reduce((sum, r) => sum + r.time, 0)
    return [{
      nickname: '你',
      avatarUrl: '',
      clearCount: passed.length,
      totalTime
    }]
  },

  getLocalStageData(stage) {
    const records = storage.get('game_records') || []
    const stageRecords = records.filter(r => r.stage === stage && r.passed)
    const bestTime = stageRecords.length > 0
      ? Math.min(...stageRecords.map(r => r.time))
      : 0
    return [{
      nickname: '你',
      avatarUrl: '',
      bestTime
    }]
  },

  formatTime(sec) {
    if (!sec || sec === 0) return '--:--'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
  }
})
