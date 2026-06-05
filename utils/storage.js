// utils/storage.js - 本地存储封装

const PREFIX = 'sudoku_'

function get(key) {
  try {
    const value = wx.getStorageSync(PREFIX + key)
    return value !== '' ? value : null
  } catch (e) {
    console.error('storage get error:', e)
    return null
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(PREFIX + key, value)
  } catch (e) {
    console.error('storage set error:', e)
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(PREFIX + key)
  } catch (e) {
    console.error('storage remove error:', e)
  }
}

function clear() {
  try {
    wx.clearStorageSync()
  } catch (e) {
    console.error('storage clear error:', e)
  }
}

module.exports = { get, set, remove, clear }
