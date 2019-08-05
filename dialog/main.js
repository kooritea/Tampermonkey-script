// ==UserScript==
// @name         简易dialog
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      *
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';
  GM_addStyle(`
  .messagebox{
      position: fixed;
      top: 60px;
      right: 0;
      z-index: 90000;
  }
  .messagebox .message{
      position: relative;
      background-color: #fff;
      box-shadow: 0 0 15px #888;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
      min-width: 150px;
      max-width: 80vw;
      padding: 10px;
      animation: newmessage 0.2s;
      transition: opacity 0.2s;
      margin-bottom: 10px;
  }
  .messagebox .message:hover{
      opacity: 0;
  }
  .messagebox .message .title{
      font-size: 20px;
  }
  .messagebox .message .content{
      padding: 0 10px;
  }
  `)
  const box = document.createElement('div');
  const id = 'gm_dialog_' + (new Date()).valueOf()
  box.className = 'messagebox'
  box.id = id
  document.body.appendChild(box)
  function dialog(arg) {
      if(!document.getElementById(id)){
        document.body.appendChild(box)
      }
      let title
      let content
      let callback
      switch (typeof arg) {
          case 'object':
              ({ title, content, callback } = arg)
              break
          default:
              title = arg
  }
      let message = document.createElement('div');
      message.className = "message"
      message.innerHTML = `<div class="title">${title}</div><div class='content'>${content ? content : ''}</div>`
      if (typeof callback === 'function') {
          message.addEventListener('click', callback)
      }
      box.appendChild(message)
      setTimeout(() => {
          message.style.opacity = 0
          setTimeout(() => {
              box.removeChild(message)
          }, 100)
      }, 5000)
  }
  unsafeWindow.$dialog = dialog
})()
