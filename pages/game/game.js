// pages/game/game.js
var app = getApp()
var sudoku = require("../../utils/sudoku.js")
var audio = require("../../utils/audio.js")
var storage = require("../../utils/storage.js")

Page({
  data: {
    stage: "four",
    size: 4,
    boxRows: 2,
    boxCols: 2,
    numbers: [1, 2, 3, 4],
    cells: [],
    selectedIndex: -1,
    selectedNum: 0,
    timerDisplay: "00:00",
    mistakesLeft: 3,
    difficultyName: "",
    timeLimit: 300,
    musicEnabled: true,
    soundEnabled: true,
    showComplete: false,
    modalTitle: "",
    isPassed: false
  },

  onLoad: function(options) {
    var stage = options.stage || "four"
    if (options.replay === "1") {
      var challenge = storage.get("current_challenge")
      if (challenge) {
        this.initReplayChallenge(challenge)
        return
      }
    }
    this.initGame(stage)
  },

  onUnload: function() {
    this.stopTimer()
  },

  // ---- 初始化 ----
  initGame: function(stage) {
    var sizeConfig = { four: 4, six: 6, nine: 9 }
    var size = sizeConfig[stage] || 4
    var boxConfig = sudoku.getBoxConfig(size)
    var diff = sudoku.getCurrentDifficulty(stage, app.globalData.gameProgress[stage].passed)
    var diffConfig = sudoku.getDifficultyConfig(stage, diff)
    var holeRange = diffConfig.holes
    var holes = Math.floor(Math.random() * (holeRange[1] - holeRange[0] + 1)) + holeRange[0]
    var nums = []
    for (var n = 1; n <= size; n++) { nums.push(n) }

    var result = sudoku.generatePuzzle(size, holes)
    var puzzle = result.puzzle
    var solution = result.solution
    var cells = []
    var givenMask = []
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var val = puzzle[r][c]
        var isGiven = val !== 0
        cells.push({ value: val, isGiven: isGiven, isSelected: false, isRelated: false, isSameNum: false, isError: false })
        givenMask.push(isGiven)
      }
    }

    this.setData({
      stage: stage, size: size,
      boxRows: boxConfig.rows, boxCols: boxConfig.cols,
      numbers: nums, cells: cells,
      selectedIndex: -1, selectedNum: 0,
      timerDisplay: "00:00", mistakesLeft: 3,
      difficultyName: diffConfig.name, timeLimit: diffConfig.timeLimit,
      showComplete: false
    })

    this._puzzle = puzzle
    this._solution = solution
    this._userBoard = puzzle.map(function(row) { return row.slice() })
    this._givenMask = givenMask
    this._stepRecords = []

    this.startTimer(); audio.setBGMEnabled(app.globalData.musicEnabled); audio.setSFXEnabled(app.globalData.soundEnabled)
  },

  // ---- 复盘挑战模式初始化 ----
  initReplayChallenge: function(challenge) {
    var stage = challenge.stage
    var sizeConfig = { four: 4, six: 6, nine: 9 }
    var size = sizeConfig[stage] || 4
    var boxConfig = sudoku.getBoxConfig(size)
    var nums = []
    for (var n = 1; n <= size; n++) { nums.push(n) }
    var diff = sudoku.getCurrentDifficulty(stage, 0)
    var diffConfig = sudoku.getDifficultyConfig(stage, diff)
    var puzzle = challenge.puzzle
    var solution = challenge.solution

    var cells = []
    var givenMask = []
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var val = puzzle[r][c]
        var isGiven = val !== 0
        cells.push({ value: val, isGiven: isGiven, isSelected: false, isRelated: false, isSameNum: false, isError: false })
        givenMask.push(isGiven)
      }
    }

    this.setData({
      stage: stage, size: size,
      boxRows: boxConfig.rows, boxCols: boxConfig.cols,
      numbers: nums, cells: cells,
      selectedIndex: -1, selectedNum: 0,
      timerDisplay: "00:00", mistakesLeft: 3,
      difficultyName: challenge.difficulty || diffConfig.name,
      timeLimit: diffConfig.timeLimit,
      showComplete: false
    })

    this._puzzle = puzzle
    this._solution = solution
    this._userBoard = puzzle.map(function(row) { return row.slice() })
    this._givenMask = givenMask
    this._stepRecords = []
    this.startTimer(); audio.setBGMEnabled(app.globalData.musicEnabled); audio.setSFXEnabled(app.globalData.soundEnabled)
  },

  // ---- 计时器 ----
  startTimer: function() {
    this.stopTimer()
    var self = this
    this._startTime = Date.now()
    this._timerInterval = setInterval(function() {
      self._elapsed = Math.floor((Date.now() - self._startTime) / 1000)
      var m = Math.floor(self._elapsed / 60)
      var s = self._elapsed % 60
      var display = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s
      self.setData({ timerDisplay: display })
    }, 500)
  },

  stopTimer: function() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval)
      this._timerInterval = null
    }
  },

  // ---- 格子选择 ----
  selectCell: function(e) {
    var index = Number(e.currentTarget.dataset.index)
    var cells = this.data.cells
    if (cells[index].isGiven) {
      wx.showToast({ title: "预设数字，点击空格子填入", icon: "none", duration: 1000 })
      return
    }

    var newCells = cells.map(function(c, i) {
      var copy = {}
      for (var k in c) { copy[k] = c[k] }
      copy.isSelected = (i === index && !c.isGiven)
      copy.isRelated = false
      copy.isSameNum = false
      return copy
    })

    if (!newCells[index].isGiven) {
      var row = Math.floor(index / this.data.size)
      var col = index % this.data.size
      var related = sudoku.getRelatedCells(row, col, this.data.size)
      for (var ri = 0; ri < related.length; ri++) {
        newCells[related[ri]].isRelated = true
      }
      var val = newCells[index].value
      if (val) {
        for (var ci = 0; ci < newCells.length; ci++) {
          if (newCells[ci].value === val && val > 0) newCells[ci].isSameNum = true
        }
      }
    }

    this.setData({ cells: newCells, selectedIndex: index, selectedNum: this.data.selectedNum })
  },

  // ---- 数字输入 ----
  inputNumber: function(e) {
    var num = Number(e.currentTarget.dataset.num)
    if (this.data.selectedIndex < 0) {
      wx.showToast({ title: "请先选择一个空格子", icon: "none", duration: 1000 })
      return
    }
    this.setData({ selectedNum: num })
    this.fillCell(this.data.selectedIndex, num)
  },

  fillCell: function(index, num) {
    num = Number(num)
    var cells = []
    for (var i = 0; i < this.data.cells.length; i++) {
      var c = {}
      for (var k in this.data.cells[i]) { c[k] = this.data.cells[i][k] }
      cells.push(c)
    }
    if (cells[index].isGiven) return

    var row = Math.floor(index / this.data.size)
    var col = index % this.data.size
    var isCorrect = sudoku.checkCell(this._userBoard, row, col, num, this.data.size)

    if (!isCorrect) {
      var mistakesLeft = this.data.mistakesLeft - 1
      cells[index].value = num
      cells[index].isError = true
      this.setData({ cells: cells, mistakesLeft: mistakesLeft }); audio.playSFX("error")

      if (mistakesLeft <= 0) {
        var self = this
        wx.showToast({ title: "试错次数用尽，重新开始", icon: "none", duration: 1500 })
        setTimeout(function() { self.initGame(self.data.stage) }, 1500)
      }
      return
    }

    cells[index].value = num
    cells[index].isError = false
    this._userBoard[row][col] = num

    this._stepRecords.push({
      row: row, col: col, num: num,
      timestamp: Math.floor((Date.now() - this._startTime) / 1000)
    })

    for (var ci = 0; ci < cells.length; ci++) {
      if (cells[ci].value === num && num > 0) cells[ci].isSameNum = true
    }
    cells[index].isSameNum = true; this.setData({ cells: cells }); audio.playSFX("fill")

    if (sudoku.isBoardComplete(this._userBoard, this._solution, this.data.size)) {
      this.onGameComplete()
    }
  },

  // ---- 擦除 ----
  eraseCell: function() {
    var index = Number(this.data.selectedIndex)
    if (index < 0 || this.data.cells[index].isGiven) return
    var row = Math.floor(index / this.data.size)
    var col = index % this.data.size
    this._userBoard[row][col] = 0
    var cells = []
    for (var i = 0; i < this.data.cells.length; i++) {
      var c = {}
      for (var k in this.data.cells[i]) { c[k] = this.data.cells[i][k] }
      cells.push(c)
    }
    cells[index].value = 0
    cells[index].isError = false
    cells[index].isSameNum = false
    this.setData({ cells: cells })
  },

  // ---- 提示 ----
  useHint: function() {
    var index = Number(this.data.selectedIndex)
    if (index < 0 || this.data.cells[index].isGiven) return
    var row = Math.floor(index / this.data.size)
    var col = index % this.data.size
    var correctNum = this._solution[row][col]
    this.fillCell(index, correctNum)
  },

  // ---- 游戏完成 ----
  onGameComplete: function() {
    this.stopTimer()
    var elapsed = this._elapsed
    var isPassed = elapsed <= this.data.timeLimit
    var stage = this.data.stage

    audio.playSFX("clear")

    var progress = app.globalData.gameProgress
    var modalTitle = isPassed ? "完成!" : "完成! 超时"

    if (isPassed) {
      progress[stage].passed++
      progress[stage].consecutiveCount++
      if (progress[stage].consecutiveCount >= 3) {
        if (stage === "four") {
          app.globalData.stageUnlock.six = true
          storage.set("stageUnlock", app.globalData.stageUnlock)
          progress[stage].consecutiveCount = 0
          modalTitle = "恭喜晋级！六宫数独已解锁"
        } else if (stage === "six") {
          app.globalData.stageUnlock.nine = true
          storage.set("stageUnlock", app.globalData.stageUnlock)
          progress[stage].consecutiveCount = 0
          modalTitle = "恭喜晋级！九宫数独已解锁"
        } else if (stage === "nine") {
          progress[stage].consecutiveCount = 0
          modalTitle = "恭喜通关！"
        }
      }
    } else {
      progress[stage].consecutiveCount = 0
    }
    storage.set("gameProgress", progress)

    var record = {
      stage: stage, difficulty: this.data.difficultyName,
      time: elapsed, passed: isPassed,
      createdAt: new Date().toISOString()
    }
    var records = storage.get("game_records") || []
    records.unshift(record)
    storage.set("game_records", records.slice(0, 100))

    this.setData({
      showComplete: true,
      modalTitle: modalTitle,
      isPassed: isPassed
    })
  },

  // ---- 收藏题目 ----
  collectPuzzle: function() {
    var puzzle = this._puzzle
    var puzzleStr = JSON.stringify(puzzle)
    var favorites = storage.get("favorites") || []
    var exists = false
    for (var i = 0; i < favorites.length; i++) {
      if (JSON.stringify(favorites[i].puzzle) === puzzleStr) { exists = true; break }
    }
    if (exists) {
      wx.showToast({ title: "已收藏过该题目", icon: "none" })
      return
    }
    favorites.unshift({
      stage: this.data.stage,
      difficulty: this.data.difficultyName,
      puzzle: puzzle,
      solution: this._solution,
      stepRecords: this._stepRecords,
      createdAt: new Date().toISOString()
    })
    storage.set("favorites", favorites.slice(0, 50))
    wx.showToast({ title: "已收藏", icon: "success" })
  },

  // ---- 继续 ----
  continueGame: function() {
    this.setData({ showComplete: false })
    this.initGame(this.data.stage)
  },

  closeModal: function() {},
  nop: function() {},

  // ---- 音效控制 ----
  toggleMusic: function() {
    var enabled = !this.data.musicEnabled
    this.setData({ musicEnabled: enabled })
    app.globalData.musicEnabled = enabled
    storage.set("musicEnabled", enabled)
    audio.setBGMEnabled(enabled)
  },

  toggleSound: function() {
    var enabled = !this.data.soundEnabled
    this.setData({ soundEnabled: enabled })
    app.globalData.soundEnabled = enabled
    storage.set("soundEnabled", enabled)
    audio.setSFXEnabled(enabled)
  },

  formatTime: function(sec) {
    var m = Math.floor(sec / 60)
    var s = sec % 60
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s
  }
})
