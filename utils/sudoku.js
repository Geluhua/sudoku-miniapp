// utils/sudoku.js - 数独生成、求解、验证算法
/**
 * 生成完整数独终盘（回溯法）
 * @param {number} size - 棋盘大小 (4/6/9)
 * @returns {number[][]} 完整数独棋盘
 */
function generateSolution(size) {
  const board = Array.from({ length: size }, () => Array(size).fill(0))
  fillBoard(board, size)
  return board
}

function fillBoard(board, size) {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        const nums = shuffle(getValidNumbers(size))
        for (const num of nums) {
          if (isValid(board, row, col, num, size)) {
            board[row][col] = num
            if (fillBoard(board, size)) return true
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function isValid(board, row, col, num, size) {
  num = Number(num)
  // 检查行
  for (let c = 0; c < size; c++) {
    if (Number(board[row][c]) === num) return false
  }
  // 检查列
  for (let r = 0; r < size; r++) {
    if (Number(board[r][col]) === num) return false
  }
  // 检查宫
  const box = getBoxConfig(size)
  const boxRow = Math.floor(row / box.rows) * box.rows
  const boxCol = Math.floor(col / box.cols) * box.cols
  for (let r = boxRow; r < boxRow + box.rows; r++) {
    for (let c = boxCol; c < boxCol + box.cols; c++) {
      if (Number(board[r][c]) === num) return false
    }
  }
  return true
}

function getBoxConfig(size) {
  if (size === 4) return { rows: 2, cols: 2 }
  if (size === 6) return { rows: 2, cols: 3 }
  return { rows: 3, cols: 3 }
}

function getValidNumbers(size) {
  return Array.from({ length: size }, (_, i) => i + 1)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 根据完整终盘挖空生成题目
 * @param {number} size - 棋盘大小
 * @param {number} holes - 挖空数量（提示数 = size*size - holes）
 * @returns {{ puzzle: number[][], solution: number[][], hints: number }}
 */
function generatePuzzle(size, holes) {
  const solution = generateSolution(size)
  const puzzle = solution.map(row => [...row])
  const positions = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c])
    }
  }
  const shuffled = shuffle(positions)
  for (let i = 0; i < holes && i < shuffled.length; i++) {
    const [r, c] = shuffled[i]
    puzzle[r][c] = 0
  }
  return { puzzle, solution, hints: size * size - holes }
}

/**
 * 获取难度对应的挖空数范围和时间限制
 * 
 * 难度分级依据：
 * 四宫(16格): 入门5-8空 / 标准9-12空 / 偏难12-13空
 * 六宫(36格): 简易≤14空 / 普通15-19空 / 难题20-24空
 * 九宫(81格): 入门≥40提示 / 初级32-39提示 / 中级26-31提示 / 高级22-25提示 / 骨灰17-21提示
 *
 * @param {string} stage - 阶段 (four/six/nine)
 * @param {string} difficulty - 难度等级
 * @returns {{ holes: number[], timeLimit: number, name: string }}
 */
function getDifficultyConfig(stage, difficulty) {
  const configs = {
    four: {
      easy:   { holes: [5, 8],   timeLimit: 50,   name: "入门简单" },
      normal: { holes: [9, 12],  timeLimit: 120,  name: "常规标准" },
      hard:   { holes: [12, 13], timeLimit: 240,  name: "偏难" }
    },
    six: {
      easy:   { holes: [12, 14], timeLimit: 120,  name: "简易" },
      normal: { holes: [15, 19], timeLimit: 300,  name: "普通" },
      hard:   { holes: [20, 24], timeLimit: 600,  name: "难题" }
    },
    nine: {
      entry:  { holes: [36, 41], timeLimit: 360,  name: "入门" },
      easy:   { holes: [42, 49], timeLimit: 540,  name: "简单" },
      medium: { holes: [50, 55], timeLimit: 900,  name: "中级" },
      hard:   { holes: [56, 59], timeLimit: 1500, name: "高级" },
      expert: { holes: [60, 64], timeLimit: 2400, name: "骨灰" }
    }
  }
  return configs[stage] && configs[stage][difficulty] 
    ? configs[stage][difficulty] 
    : configs.four.easy
}

/**
 * 根据通关次数获取当前难度等级名称
 */
function getCurrentDifficulty(stage, passedCount) {
  // 每连续通关3局升一个难度
  const difficultyIndex = Math.floor(passedCount / 3)
  if (stage === "four") {
    const levels = ["easy", "normal", "hard"]
    return levels[Math.min(difficultyIndex, levels.length - 1)]
  }
  if (stage === "six") {
    const levels = ["easy", "normal", "hard"]
    return levels[Math.min(difficultyIndex, levels.length - 1)]
  }
  // nine: 5个难度等级
  const levels = ["entry", "easy", "medium", "hard", "expert"]
  return levels[Math.min(difficultyIndex, levels.length - 1)]
}

/**
 * 验证单个位置的填入是否正确
 */
function checkCell(board, row, col, num, size) {
  return isValid(board, row, col, num, size)
}

/**
 * 验证整个棋盘是否填写完整且正确
 */
function isBoardComplete(board, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Number(board[r][c]) !== Number(solution[r][c])) return false
    }
  }
  return true
}

/**
 * 获取同行、同列的格子索引（不含自身）
 */
function getRowColCells(row, col, size) {
  const related = new Set()
  for (let i = 0; i < size; i++) {
    related.add(i * size + col)
    related.add(row * size + i)
  }
  related.delete(row * size + col)
  return Array.from(related)
}

/**
 * 获取与指定格子相关的格子（同行、同列、同宫）
 */
function getRelatedCells(row, col, size) {
  const related = new Set(getRowColCells(row, col, size))
  const box = getBoxConfig(size)
  const boxRow = Math.floor(row / box.rows) * box.rows
  const boxCol = Math.floor(col / box.cols) * box.cols
  for (let r = boxRow; r < boxRow + box.rows; r++) {
    for (let c = boxCol; c < boxCol + box.cols; c++) {
      related.add(r * size + c)
    }
  }
  related.delete(row * size + col)
  return Array.from(related)
}

module.exports = {
  generateSolution,
  generatePuzzle,
  getDifficultyConfig,
  getCurrentDifficulty,
  checkCell,
  isBoardComplete,
  getRowColCells,
  getRelatedCells,
  getBoxConfig,
  getValidNumbers
}
