// pages/favorites/favorites.js
const storage = require('../../utils/storage.js')

Page({
  data: { favorites: [] },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    const favorites = storage.get('favorites') || []
    this.setData({
      favorites: favorites.map(f => ({
        ...f,
        createdAt: this.formatDate(f.createdAt)
      }))
    })
  },

  getStageLabel(stage) {
    const labels = { four: '四宫数独', six: '六宫数独', nine: '九宫数独' }
    return labels[stage] || stage
  },

  goReview(e) {
    const fav = this.data.favorites[e.currentTarget.dataset.index]
    storage.set('current_review', fav)
    wx.navigateTo({ url: '/pages/review/review' })
  },

  goChallenge(e) {
    const fav = this.data.favorites[e.currentTarget.dataset.index]
    storage.set('current_challenge', fav)
    wx.navigateTo({ url: '/pages/game/game?stage=' + fav.stage + '&replay=1' })
  },

  removeFav(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该题目吗？',
      success: (res) => {
        if (res.confirm) {
          const favorites = this.data.favorites.filter((_, i) => i !== index)
          storage.set('favorites', favorites.map(f => ({ ...f, createdAt: f.createdAt })))
          this.loadFavorites()
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }
      }
    })
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const m = d.getMonth() + 1
      const day = d.getDate()
      return m + '/' + day + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
    } catch { return dateStr }
  }
})
