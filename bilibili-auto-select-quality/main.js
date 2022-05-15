// ==UserScript==
// @name         B站自动设置最高清晰度
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://live.bilibili.com/*
// @match        https://www.bilibili.com/video/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const timer = setInterval(()=>{
        let videoDom = document.querySelector("#live-player");
        if(videoDom){
            videoDom.dispatchEvent(new Event("mousemove"));
            let quality = document.querySelector(".quality-wrap");
            quality.dispatchEvent(new Event("mouseenter"));
            setTimeout(()=>{
                if (
                    document.querySelector(".quality-it.selected") !== document.querySelector(".quality-it")
                ) {
                    let list = document.querySelectorAll(".quality-it");
                    list[0].click();
                }
                quality.dispatchEvent(new Event("mouseleave"))
                clearInterval(timer);
            },1000)
        }
        if(document.querySelector('.bui-select-item')){
            document.querySelector('.bui-select-item').click()
            clearInterval(timer);
        }
    },2000)
})();
