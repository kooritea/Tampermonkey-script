// ==UserScript==
// @name         动漫花园列表页直接下载种子脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://share.dmhy.org/*
// @grant        none
// @run-at document-end
// ==/UserScript==

(function() {
    'use strict';
    function init(){
        $("#topic_list tr .download-arrow").each(function(){
            $(this).attr('href',"")
            $(this).attr('title',"下载种子")
            let url = $(this).parent().prev().children("a").attr("href")
            $(this).attr("onclick","return false")
            $(this).click(function(){
                Download(url)
                return false
            })
        })
        $("#topic_list tr:eq(0) th:eq(3)").text("下载种子")
    }
    function Download(url){
        $.get(url,function(data){
            let downurl = (data.match(/<strong>會員專用連接:<\/strong>&nbsp;<a href="(.*?)">/))[1]
            let a = document.createElement('a')
            a.href = downurl
            a.click()
        })
    }
    init()
  })();