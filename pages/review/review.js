// pages/review/review.js
const storage = require('../../utils/storage.js')
const sudoku = require('../../utils/sudoku.js')

Page({
  data: {
    hasData: false,
    stageLabel: '',
    difficulty: '',
    size: 4,
    boxRows: 2,
    boxCols: 2,
    cells: [],
    currentStep: 0,
    totalSteps: 0,
    progressPercent: 0,
    isPlaying: false,
    _stepRecords: [],
    _playInterval: null
  },

  onLoad() {
    const data = storage.get('current_review')
    if (!data) {
      this.setData({ hasData: false })
      return
    }
    const sizeConfig = { four: 4, six: 6, nine: 9 }
    const size = sizeConfig[data.stage] || 4
    const boxConfig = sudoku.getBoxConfig(size)
    const labels = { four: '四宫数独', six: '六宫数独', nine: '九宫数独' }

    // 初始化棋盘（只显示题目提示）
    const cells = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = data.puzzle[r][c]
        cells.push({ value: val, isGiven: val !== 0, isNew: false, isHighlight: false })
      }
    }

    this.setData({
      hasData: true,
      stageLabel: labels[data.stage] || data.stage,
      difficulty: data.difficulty,
      size,
      boxRows: boxConfig.rows,
      boxCols: boxConfig.cols,
      cells,
      currentStep: 0,
      totalSteps: (data.stepRecords || []).length,
      progressPercent: 0
    })

    this._puzzle = data.puzzle
    this._stepRecords = data.stepRecords || []
    this._currentBoard = data.puzzle.map(row => [...row])
  },

  onUnload() {
    if (this._playInterval) clearInterval(this._playInterval)
  },

  // 前进一步
  stepNext() {
    if (this.data.currentStep >= this._stepRecords.length) return
    const step = this._stepRecords[this.data.currentStep]
    this.applyStep(step)
    const next = this.data.currentStep + 1
    this.setData({
      currentStep: next,
      progressPercent: Math.round((next / this._stepRecords.length) * 100)
    })
  },

  // 后退一步
  stepPrev() {
    if (this.data.currentStep <= 0) return
    const prev = this.data.currentStep - 1
    // 重建棋盘到上一步
    this._currentBoard = this._puzzle.map(row => [...row])
    for (let i = 0; i < prev; i++) {
      const s = this._stepRecords[i]
      this._currentBoard[s.row][s.col] = s.num
    }
    // 重建UI
    const cells = this.buildCells(prev - 1)
    this.setData({
      cells,
      currentStep: prev,
      progressPercent: Math.round((prev / this._stepRecords.length) * 100)
    })
  },

  // 播放/暂停
  togglePlay() {
    if (this.data.isPlaying) {
      this.pausePlay()
    } else {
      this.startPlay()
    }
  },

  startPlay() {
    if (this.data.currentStep >= this._stepRecords.length) {
      this.restart()
    }
    this.setData({ isPlaying: true })
    this._playInterval = setInterval(() => {
      if (this.data.currentStep >= this._stepRecords.length) {
        this.pausePlay()
        return
      }
      this.stepNext()
    }, 800)
  },

  pausePlay() {
    if (this._playInterval) {
      clearInterval(this._playInterval)
      this._playInterval = null
    }
    this.setData({ isPlaying: false })
  },

  restart() {
    this.pausePlay()
    this._currentBoard = this._puzzle.map(row => [...row])
    this.setData({
      cells: this.buildCells(-1),
      currentStep: 0,
      progressPercent: 0
    })
  },

  // 重新挑战
  reChallenge() {
    const data = storage.get('current_review')
    if (!data) return
    storage.set('current_challenge', data)
    wx.navigateTo({ url: '/pages/game/game?stage=' + data.stage + '&replay=1' })
  },

  // 辅助方法
  applyStep(step) {
    this._currentBoard[step.row][step.col] = step.num
    const cells = this.buildCells(this.data.currentStep)
    this.setData({ cells })
  },

  buildCells(lastStepIndex) {
    const size = this.data.size
    const cells = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const originalVal = this._puzzle[r][c]
        const currentVal = this._currentBoard[r][c]
        const isGiven = originalVal !== 0
        const isNew = !isGiven && currentVal !== 0 && lastStepIndex >= 0 &&
          lastStepIndex < this._stepRecords.length &&
          this._stepRecords[lastStepIndex].row === r &&
          this._stepRecords[lastStepIndex].col === c
        cells.push({ value: currentVal, isGiven, isNew, isHighlight: isNew })
      }
    }
    return cells
  }
})
