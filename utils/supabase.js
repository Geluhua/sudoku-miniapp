// utils/supabase.js - Supabase 客户端封装
// 注意：实际使用时需替换为真实的 Supabase URL 和 anon key
// 并安装 supabase-js 适配微信小程序的版本

const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

let supabase = null

async function init() {
  // 微信小程序中使用 Supabase 需要特殊适配
  // 这里提供接口框架，实际部署时替换
  try {
    // 尝试加载 supabase client
    // const { createClient } = require('supabase-js-wechat')
    // supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log('Supabase client initialized')
  } catch (e) {
    console.warn('Supabase client not available, using local mode:', e)
  }
}

// ---- 用户相关 ----

async function getUser(openid) {
  if (!supabase) return null
  const { data } = await supabase.from('users').select('*').eq('openid', openid).single()
  return data
}

async function createUser(userData) {
  if (!supabase) return null
  const { data } = await supabase.from('users').insert(userData).select().single()
  return data
}

async function updateUser(openid, updates) {
  if (!supabase) return null
  const { data } = await supabase.from('users').update(updates).eq('openid', openid).select().single()
  return data
}

// ---- 游戏记录 ----

async function saveGameRecord(record) {
  if (!supabase) return null
  const { data } = await supabase.from('game_records').insert(record).select().single()
  return data
}

async function getUserGameRecords(openid, limit = 20) {
  if (!supabase) return []
  const { data } = await supabase.from('game_records')
    .select('*').eq('openid', openid).order('created_at', { ascending: false }).limit(limit)
  return data || []
}

// ---- 排行榜 ----

async function getClearLeaderboard() {
  if (!supabase) return []
  const { data } = await supabase.from('users')
    .select('nickname,avatar_url,clear_count,total_time')
    .order('clear_count', { ascending: false })
    .order('total_time', { ascending: true })
    .limit(100)
  return data || []
}

async function getStageTimeLeaderboard(stage) {
  if (!supabase) return []
  const column = stage + '_best_time'
  const { data } = await supabase.from('users')
    .select('nickname,avatar_url,' + column)
    .order(column, { ascending: true })
    .limit(100)
  return data || []
}

async function updateUserBestTime(openid, stage, time) {
  if (!supabase) return
  const column = stage + '_best_time'
  const { data: user } = await supabase.from('users').select(column).eq('openid', openid).single()
  if (!user || !user[column] || time < user[column]) {
    await supabase.from('users').update({ [column]: time }).eq('openid', openid)
  }
}

// ---- 收藏 ----

async function saveFavorite(openid, favoriteData) {
  if (!supabase) return null
  const { data } = await supabase.from('favorites').insert({
    openid,
    ...favoriteData
  }).select().single()
  return data
}

async function getFavorites(openid) {
  if (!supabase) return []
  const { data } = await supabase.from('favorites')
    .select('*').eq('openid', openid).order('created_at', { ascending: false })
  return data || []
}

async function removeFavorite(id) {
  if (!supabase) return
  await supabase.from('favorites').delete().eq('id', id)
}

// ---- 对战 ----

async function getBattleStats(openid) {
  if (!supabase) return { total: 0, wins: 0, losses: 0, avgTime: 0 }
  const { data } = await supabase.from('battle_stats')
    .select('*').eq('openid', openid).single()
  return data || { total: 0, wins: 0, losses: 0, avgTime: 0 }
}

async function getBattleLeaderboard() {
  if (!supabase) return []
  const { data } = await supabase.from('battle_stats')
    .select('nickname,avatar_url,wins,win_rate')
    .order('wins', { ascending: false })
    .limit(100)
  return data || []
}

module.exports = {
  init,
  getUser, createUser, updateUser,
  saveGameRecord, getUserGameRecords,
  getClearLeaderboard, getStageTimeLeaderboard, updateUserBestTime,
  saveFavorite, getFavorites, removeFavorite,
  getBattleStats, getBattleLeaderboard
}
