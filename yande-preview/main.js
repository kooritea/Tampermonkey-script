// ==UserScript==
// @name         yande-preview
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://yande.re/post*
// @run-at       document-end
// @grant GM_openInTab
// ==/UserScript==

(function() {
  'use strict';
  
  const preview = async function(e){
    e.preventDefault()
    let showUrl = e.target.parentElement.href
    let largeImgUrl = await getLargeImgUrl(showUrl)
    GM_openInTab(largeImgUrl,{
      active: true
    })
  }

  const getLargeImgUrl = function(showUrl){
    return new Promise((reslove,reject)=>{
      let xhr = new XMLHttpRequest()
      xhr.open('get',showUrl)
      xhr.withCredentials = true
      xhr.onreadystatechange = function(e){
        if(xhr.readyState === 4){
          if (xhr.status === 200) {
            try{
              let sample = xhr.responseText.match(/<img(.*?)id="image"(.*?)src="(.*?)"(.*?)>/)[3]
              let large = sample.replace(/sample/,"image")
              reslove(large)
            }
            catch(e){
              reject(e)
            }
          }
          else{
            reject('error')
          }
        }
      }
      xhr.send()
    })
  }

  let a = document.getElementsByClassName('preview')
  for(let item of a){
    item.addEventListener('click',preview)
  }
})();