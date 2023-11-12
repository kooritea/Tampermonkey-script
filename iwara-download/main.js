// ==UserScript==
// @name        iwara-download
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.iwara.tv/video/*
// @grant        GM_download
// @grant        GM_info
// ==/UserScript==

(function() {
  'use strict'

  const timer = setInterval(() => {
    GM_info.downloadMode = 'native'
    if (document.querySelector('.vjs-control-bar')) {
      clearInterval(timer)
      const btn = document.createElement('div')
      btn.innerHTML = '下载'
      btn.style.cursor="pointer"
      btn.style.display="flex"
      btn.style.alignItems="center"
      btn.style.justifyContent="center"
      document.querySelector('.vjs-control-bar').appendChild(btn)
      btn.addEventListener('click', () => {
        GM_download({
          url: document.querySelector('.vjs-tech').src,
          name: document.querySelector('.page-video__details>.text--h1').innerText,
          saveAs: true
        });
        alert('正在下载')
      })
    }
  }, 2000)
})()
