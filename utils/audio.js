// utils/audio.js - 音效与背景音乐管理

let bgmAudio = null
let sfxEnabled = true
let bgmEnabled = true

function init() {
  // 微信小程序背景音频
  bgmAudio = wx.createInnerAudioContext()
  bgmAudio.src = '/audio/bgm.mp3'
  bgmAudio.loop = true
  bgmAudio.volume = 0.3
}

function playBGM() {
  if (!bgmEnabled || !bgmAudio) return
  var _bgmPlay = bgmAudio.play(); if (_bgmPlay) _bgmPlay.catch(() => {})
}

function pauseBGM() {
  if (bgmAudio) bgmAudio.pause()
}

function stopBGM() {
  if (bgmAudio) bgmAudio.stop()
}

function setBGMEnabled(enabled) {
  bgmEnabled = enabled
  if (enabled) {
    playBGM()
  } else {
    pauseBGM()
  }
}

function setSFXEnabled(enabled) {
  sfxEnabled = enabled
}

// 播放音效：fill（填写）、error（填错）、clear（通关）
function playSFX(type) {
  if (!sfxEnabled) return
  const sfx = wx.createInnerAudioContext()
  switch (type) {
    case 'fill': sfx.src = '/audio/fill.mp3'; break
    case 'error': sfx.src = '/audio/error.mp3'; break
    case 'clear': sfx.src = '/audio/clear.mp3'; break
    default: return
  }
  sfx.volume = 0.6; var _sfxPlay = sfx.play(); if (_sfxPlay) _sfxPlay.catch(() => {})
  sfx.onEnded(() => sfx.destroy())
}

function destroy() {
  if (bgmAudio) {
    bgmAudio.destroy()
    bgmAudio = null
  }
}

module.exports = {
  init, playBGM, pauseBGM, stopBGM,
  setBGMEnabled, setSFXEnabled, playSFX, destroy
}
