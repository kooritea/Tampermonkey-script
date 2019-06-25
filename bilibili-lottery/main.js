// ==UserScript==
// @name         bilibili-lottery
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://live.bilibili.com/*
// @run-at        document-end
// ==/UserScript==

(function() {
  'use strict';
  setInterval(()=>{
      $('.link-popup-ctnr').css('display','none')
      if($('.lottery-box.small-tv-lottery')[0]){
          $('.lottery-box.small-tv-lottery').click()
      }
      if($('.lottery-box.guard-lottery')[0]){
          $('.lottery-box.guard-lottery')[0].click()
      }
      if($('.popup-content-ctnr .bl-button')[0]){
          $('.popup-content-ctnr .bl-button')[0].click();
      }
  },1000)
})();