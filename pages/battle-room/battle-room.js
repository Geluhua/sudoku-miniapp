// pages/battle-room/battle-room.js
const sudoku = require('../../utils/sudoku.js')
const storage = require('../../utils/storage.js')

Page({
  data: {
    status: 'waiting', // waiting | playing | result
    roomCode: '',
    cells: [],
    selectedIndex: -1,
    selectedNum: 0,
    myTimerDisplay: '00:00',
    opponentTimerDisplay: '00:00',
    myDone: false,
    opponentDone: false,
    myWon: false,
    _puzzle: null,
    _solution: null,
    _userBoard: null,
    _startTime: 0,
    _timerInterval: null,
    _elapsed: 0,
    _opponentElapsed: 0
  },

  onLoad(options) {
    // 生成房间码
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.setData({ roomCode, action: options.action })
  },

  onUnload() {
    if (this._timerInterval) clearInterval(this._timerInterval)
  },

  // 开始模拟对战
  startSimBattle() {
    const { puzzle, solution } = sudoku.generatePuzzle(9, 50)
    const cells = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = puzzle[r][c]
        cells.push({ value: val, isGiven: val !== 0, isSelected: false, isRelated: false, isError: false })
      }
    }
    this._puzzle = puzzle
    this._solution = solution
    this._userBoard = puzzle.map(row => [...row])
    this.setData({ status: 'playing', cells })
    this.startMyTimer()
    this.simulateOpponent()
  },

  startMyTimer() {
    this._startTime = Date.now()
    this._timerInterval = setInterval(() => {
      this._elapsed = Math.floor((Date.now() - this._startTime) / 1000)
      const m = Math.floor(this._elapsed / 60)
      const s = this._elapsed % 60
      this.setData({ myTimerDisplay: String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') })
    }, 500)
  },

  // 模拟对手（随机速度完成）
  simulateOpponent() {
    const totalTime = 120 + Math.floor(Math.random() * 300) // 2-7分钟
    let elapsed = 0
    const interval = setInterval(() => {
      elapsed++
      const m = Math.floor(elapsed / 60)
      const s = elapsed % 60
      this.setData({ opponentTimerDisplay: String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') })
      if (elapsed >= totalTime) {
        clearInterval(interval)
        this.setData({ opponentDone: true })
        if (!this.data.myDone) {
          this.endBattle(false)
        }
      }
    }, 1000)
  },

  selectCell(e) {
    const index = e.currentTarget.dataset.index
    const cell = this.data.cells[index]
    if (cell.isGiven) return
    const cells = this.data.cells.map(c => ({ ...c, isSelected: false, isRelated: false }))
    cells[index].isSelected = true
    const row = Math.floor(index / 9)
    const col = index % 9
    const related = sudoku.getRelatedCells(row, col, 9)
    related.forEach(i => { if (i < cells.length) cells[i].isRelated = true })
    this.setData({ cells, selectedIndex: index })
  },

  inputNumber(e) {
    const num = e.currentTarget.dataset.num
    const index = this.data.selectedIndex
    if (index < 0) return
    this.setData({ selectedNum: num })
    const row = Math.floor(index / 9)
    const col = index % 9
    const isCorrect = sudoku.checkCell(this._userBoard, row, col, num, 9)
    const cells = [...this.data.cells]
    if (!isCorrect) {
      cells[index] = { ...cells[index], value: num, isError: true }
      this.setData({ cells })
      return
    }
    cells[index] = { ...cells[index], value: num, isError: false }
    this._userBoard[row][col] = num
    this.setData({ cells })
    if (sudoku.isBoardComplete(this._userBoard, this._solution, 9)) {
      this.setData({ myDone: true })
      if (this._timerInterval) clearInterval(this._timerInterval)
      if (!this.data.opponentDone) {
        this.endBattle(true)
      }
    }
  },

  eraseCell() {
    const index = this.data.selectedIndex
    if (index < 0 || this.data.cells[index].isGiven) return
    const row = Math.floor(index / 9)
    const col = index % 9
    this._userBoard[row][col] = 0
    const cells = [...this.data.cells]
    cells[index] = { ...cells[index], value: 0, isError: false }
    this.setData({ cells })
  },

  endBattle(myWon) {
    this.setData({ status: 'result', myWon })
    // 保存对战统计
    let stats = storage.get('battle_stats') || { total: 0, wins: 0, losses: 0, avgTime: 0 }
    stats.total++
    if (myWon) stats.wins++
    else stats.losses++
    stats.avgTime = Math.floor(((stats.avgTime * (stats.total - 1)) + this._elapsed) / stats.total)
    storage.set('battle_stats', stats)
  },

  goBack() {
    wx.navigateBack()
  }
})
