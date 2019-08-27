// ==UserScript==
// @name         bilibili-lottery
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://live.bilibili.com/*
// @run-at        document-end
// ==/UserScript==

(function () {
    'use strict';
    setInterval(() => {
        if ($('.link-popup-ctnr')) {
            $('.link-popup-ctnr').css('display', 'none')
        }

        if ($('.chat-draw-area-cntr .function-bar')[0]) {
            $('.chat-draw-area-cntr .function-bar')[0].click()
        }
    }, 1000)
})();