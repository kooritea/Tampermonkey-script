// ==UserScript==
// @name         动漫花园列表页直接下载种子脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.dmhy.org/*
// @grant        GM_xmlhttpRequest
// @run-at document-end
// ==/UserScript==

(function () {
    'use strict';
    function init() {
        $("#topic_list tr .download-arrow").each(function () {
            $(this).attr('href', "")
            $(this).attr('title', "下载种子")
            let url = $(this).parent().prev().children("a").attr("href")
            $(this).attr("onclick", "return false")
            $(this).click(function () {
                if (!localStorage._TamperMonkeyDefaultDownloadMethod) {
                    let set = window.prompt('选择默认下载方式\n1: aria2\n2: 浏览器下载种子')
                    while (set !== '1' && set !== '2') {
                        set = window.prompt('选择默认下载方式\n1: aria2\n2: 浏览器下载种子')
                    }
                    localStorage._TamperMonkeyDefaultDownloadMethod = set
                }
                switch (localStorage._TamperMonkeyDefaultDownloadMethod) {
                    case '1':
                        Aria2Download(url)
                        break
                    case '2':
                        Download(url)
                        break
                }
                return false
            })
        })
        $("#topic_list tr:eq(0) th:eq(3)").text("下载种子")
    }
    function Download(url) {
        $.get(url, function (data) {
            let downurl = (data.match(/<strong>會員專用連接:<\/strong>&nbsp;<a href="(.*?)">/))[1]
            let a = document.createElement('a')
            a.href = downurl
            a.click()
        })
    }

    function Aria2Download(url) {
        $.ajax({
            url,
            success: function (data) {
                let downurl = (data.match(/<strong>Magnet連接:<\/strong>&nbsp;<a class="magnet" id="a_magnet" href="(.*?)">/))[1]
                let aria2url = localStorage._TamperMonkeyAria2DownloadURL || window.prompt("主机地址", "http://192.168.1.1/jsonrpc");
                let token = localStorage._TamperMonkeyAria2DownloadToken || window.prompt("Token")

                GM_xmlhttpRequest({
                    url: aria2url,
                    method: "POST",
                    data: JSON.stringify({
                        "jsonrpc": "2.0",
                        "method": "aria2.addUri",
                        "id": "QXJpYU5nXzIzMzMzMzMzMzMzXzAuMjI4NDE0NTI5NjA2NTY1MTY=",
                        "params": [
                            `token:${token}`,
                            [
                                downurl
                            ],
                            {}
                        ]
                    }),
                    onload: function (a) {
                        if (a.status === 200) {
                            localStorage._TamperMonkeyAria2DownloadURL = aria2url
                            localStorage._TamperMonkeyAria2DownloadToken = token
                            if (window.$dialog) {
                                window.$dialog('添加成功')
                            } else {
                                alert('添加成功')
                            }
                        }
                    }
                })
            }
        })
    }
    init()
})();