// app.js - 数独小游戏入口
const supabase = require('./utils/supabase.js')
const storage = require('./utils/storage.js')
const audio = require('./utils/audio.js')

App({
  globalData: {
    userInfo: null,           // 微信用户信息
    openid: null,             // 用户openid
    sudokuValue: {            // 数独值
      daily: 9,              // 每日赠送（次日清零）
      bonus: 0               // 分享/广告累积（不清零）
    },
    stageUnlock: {            // 阶段解锁状态
      four: true,             // 四宫默认解锁
      six: false,             // 六宫
      nine: false             // 九宫
    },
    gameProgress: {           // 游戏进度
      four: { passed: 0, consecutiveCount: 0 },   // 达标局数
      six: { passed: 0, consecutiveCount: 0 },
      nine: { passed: 0, consecutiveCount: 0 }
    },
    soundEnabled: true,       // 音效开关
    musicEnabled: true,       // 背景音乐开关
    audioCtx: null            // 音频上下文
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
    // 加载本地数据
    this.loadLocalData()
    // 初始化Supabase
    this.initSupabase()
    // 初始化音频
    audio.init()
  },

  checkLoginStatus() {
    const userInfo = storage.get('userInfo')
    const openid = storage.get('openid')
    if (userInfo && openid) {
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
    }
  },

  loadLocalData() {
    const sudokuValue = storage.get('sudokuValue')
    if (sudokuValue) this.globalData.sudokuValue = sudokuValue
    const stageUnlock = storage.get('stageUnlock')
    if (stageUnlock) this.globalData.stageUnlock = stageUnlock
    const gameProgress = storage.get('gameProgress')
    if (gameProgress) this.globalData.gameProgress = gameProgress
    const soundEnabled = storage.get('soundEnabled')
    if (soundEnabled !== undefined) this.globalData.soundEnabled = soundEnabled
    const musicEnabled = storage.get('musicEnabled')
    if (musicEnabled !== undefined) this.globalData.musicEnabled = musicEnabled
  },

  async initSupabase() {
    await supabase.init()
  },

  // 获取总剩余数独值
  getTotalSudokuValue() {
    return this.globalData.sudokuValue.daily + this.globalData.sudokuValue.bonus
  },

  // 消耗数独值
  consumeSudokuValue(count = 1) {
    const total = this.getTotalSudokuValue()
    if (total < count) return false
    // 优先消耗每日赠送的
    if (this.globalData.sudokuValue.daily >= count) {
      this.globalData.sudokuValue.daily -= count
    } else {
      const remain = count - this.globalData.sudokuValue.daily
      this.globalData.sudokuValue.daily = 0
      this.globalData.sudokuValue.bonus -= remain
    }
    storage.set('sudokuValue', this.globalData.sudokuValue)
    return true
  },

  // 增加数独值
  addSudokuValue(count, type = 'bonus') {
    if (type === 'daily') {
      this.globalData.sudokuValue.daily += count
    } else {
      this.globalData.sudokuValue.bonus += count
    }
    storage.set('sudokuValue', this.globalData.sudokuValue)
  }
})
