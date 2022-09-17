// ==UserScript==
// @name         cus-style
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';
  const configs = [
    {
      url: /.*/,
      style: `
        [class^=chp_ads_block_modal] {
          display: none;
        }
        .article_content *{
          user-select: text!important;
        }
      `
    },
    {
      url: /csdn\.net/,
      style: `
        *{
          user-select: text!important;
        }
      `
    },
    {
      url: /www\.bilibili\.com/,
      style: `
        .bpx-player-state-wrap{
          display: none;
        }
      `
    },
  ]
  for(const config of configs){
    if(config.url.test(location.href)){
      GM_addStyle(config.style)
    }
  }
})();
