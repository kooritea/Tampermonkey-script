// ==UserScript==
// @name         xhr-interceptor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Kooritea
// @include      *
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

if(self !== top){
  // 禁止在iframe中执行
  return
}

class InterceptorUI {
  constructor(){
    this.interceptRequest = false
    this.interceptResponse = false
    this.UIRoot = unsafeWindow.document.createElement('div')
    this.UIRoot.style='position: fixed;height:100vh;width:300px;right:0px;top:0px;background-color: #fff;z-index: 999999999999;box-shadow: 15px 0px 40px #000;'
    unsafeWindow.addEventListener('load',()=>{
      unsafeWindow.document.body.appendChild(this.UIRoot)
    })
    this.initController()
    this.initBox()
  }
  initBox(){
    this.box = unsafeWindow.document.createElement('div')
    this.box.style = "overflow-y: auto;height:calc(100% - 50px)"
    this.UIRoot.appendChild(this.box)
  }

  initController(){
    const UI_Controller = unsafeWindow.document.createElement('div')
    UI_Controller.style="padding:10px;height:50px;box-shadow:0px 4px 10px 4px rgba(0, 0, 0, 0.2);"

    const UI_RequestCheckBox_Label = unsafeWindow.document.createElement('label')
    UI_RequestCheckBox_Label.style="cursor: pointer;"
    UI_RequestCheckBox_Label.innerHTML="拦截请求"
    const UI_RequestCheckBox = unsafeWindow.document.createElement('input')
    UI_RequestCheckBox.type = 'checkbox'
    UI_RequestCheckBox_Label.appendChild(UI_RequestCheckBox)
    UI_Controller.appendChild(UI_RequestCheckBox_Label)
    UI_RequestCheckBox.addEventListener('change',()=>{
      this.interceptRequest = UI_RequestCheckBox.checked
    })

    const UI_ResponseCheckBox_Label = unsafeWindow.document.createElement('label')
    UI_ResponseCheckBox_Label.style="margin-left:20px;cursor: pointer;"
    UI_ResponseCheckBox_Label.innerHTML="拦截响应"
    const UI_ResponseCheckBox = unsafeWindow.document.createElement('input')
    UI_ResponseCheckBox.type = 'checkbox'
    UI_ResponseCheckBox_Label.appendChild(UI_ResponseCheckBox)
    UI_Controller.appendChild(UI_ResponseCheckBox_Label)
    UI_ResponseCheckBox.addEventListener('change',()=>{
      this.interceptResponse = UI_ResponseCheckBox.checked
    })

    const UI_Close = unsafeWindow.document.createElement('div')
    UI_Close.style="position:absolute;top:5px;right:5px;cursor: pointer;"
    UI_Close.innerHTML="X"
    UI_Controller.appendChild(UI_Close)
    UI_Close.addEventListener('click',()=>{
      this.UIRoot.style.display = 'none'
    })

    this.UIRoot.appendChild(UI_Controller)
  }

  addXHR(xhr){
    const UI_Item = unsafeWindow.document.createElement('div')
    UI_Item.style="padding: 10px;border-bottom: 1px solid #000;"
    const UI_URL = unsafeWindow.document.createElement('div')
    UI_URL.style="white-space: nowrap;cursor: pointer;text-overflow:ellipsis; overflow-x: hidden;"
    UI_URL.innerHTML=`${xhr.xhrInterceptor.method.toUpperCase()} ${xhr.xhrInterceptor.url}`
    UI_URL.title = xhr.xhrInterceptor.url
    UI_Item.appendChild(UI_URL)

    this.addRequestQueryUI(xhr,UI_Item)
    this.addRequestHeaderUI(xhr,UI_Item)
    this.addRequestBodyUI(xhr,UI_Item)
    
    this.box.prepend(UI_Item)
    xhr._whenLoad(()=>{
      this.addResponseHeaderUI(xhr,UI_Item)
      this.addResponseBodyUI(xhr,UI_Item)
      if(this.interceptResponse){
        this.addResponseController(xhr,UI_Item)
      }else{
        xhr._adoptResponse()
      }
    })
    if(this.interceptRequest){
      this.addRequestController(xhr,UI_Item)
    }else{
      xhr._send()
    }
  }

  addRequestQueryUI(xhr,UI_Item){
    if(xhr.xhrInterceptor.url.indexOf('?') === -1){
      return
    }
    const UI_RequestQuery = unsafeWindow.document.createElement('div')
    UI_RequestQuery.style = 'background-color: #aaa;padding: 5px;'
    const UI_RequestQuery_Title = unsafeWindow.document.createElement('div')
    UI_RequestQuery_Title.style="cursor: pointer;"
    UI_RequestQuery.appendChild(UI_RequestQuery_Title)
    UI_RequestQuery_Title.innerHTML="RequestQuery"
    const query = {}
    const str = xhr.xhrInterceptor.url.slice(xhr.xhrInterceptor.url.indexOf('?')+1)
    const url = xhr.xhrInterceptor.url.slice(0,xhr.xhrInterceptor.url.indexOf('?'))
    const queryStrs = str.split('&')
    for(let queryStr of queryStrs){
      const [key,value] = queryStr.split('=')
      query[decodeURI(key)]=decodeURI(value)
    }
    const UI_RequestQuery_Content = unsafeWindow.document.createElement('textarea')
    UI_RequestQuery_Content.style="display:none;min-width: 100%;max-width: 100%;height:110px"
    UI_RequestQuery_Content.value=JSON.stringify(query,null,4)
    UI_RequestQuery_Content.addEventListener('input',()=>{
      try{
        const queryObject = JSON.parse(UI_RequestQuery_Content.value)
        let urlQueryStr = ''
        for(let key in queryObject){
          urlQueryStr += `${urlQueryStr?'&':''}${encodeURI(key)}=${encodeURI(queryObject[key])}`
        }
        xhr.xhrInterceptor.url = `${url}?${urlQueryStr}`
      }catch(e){
        console.error('查询参数输入不合法',e)
      }
    })
    if(!this.interceptRequest){
      UI_RequestQuery_Content.setAttribute('disabled','')
    }else{
      xhr._whenSend(()=>{
        UI_RequestQuery_Content.setAttribute('disabled','')
      })
    }
    UI_RequestQuery.appendChild(UI_RequestQuery_Content)
    UI_RequestQuery_Title.addEventListener('click',()=>{
      if(UI_RequestQuery_Content.style.display === 'none'){
        UI_RequestQuery_Content.style.display = 'block'
      }else{
        UI_RequestQuery_Content.style.display = 'none'
      }
    })
    UI_Item.appendChild(UI_RequestQuery)
  }

  addRequestHeaderUI(xhr,UI_Item){
    if(Object.keys(xhr.xhrInterceptor.requestHeaders).length === 0){
      return
    }
    const UI_RequestHeader = unsafeWindow.document.createElement('div')
    UI_RequestHeader.style = 'background-color: #aaa;padding: 5px;'
    const UI_RequestHeader_Title = unsafeWindow.document.createElement('div')
    UI_RequestHeader_Title.style="cursor: pointer;"
    UI_RequestHeader.appendChild(UI_RequestHeader_Title)
    UI_RequestHeader_Title.innerHTML="RequestHeader"
    const UI_RequestHeader_Content = unsafeWindow.document.createElement('textarea')
    UI_RequestHeader_Content.style="display:none;min-width: 100%;max-width: 100%;height:110px"
    UI_RequestHeader_Content.value=JSON.stringify(xhr.xhrInterceptor.requestHeaders,null,4)
    UI_RequestHeader_Content.addEventListener('input',()=>{
      try{
        xhr.xhrInterceptor.requestHeaders = JSON.parse(UI_RequestHeader_Content.value)
      }catch(e){
        console.error('请求头输入不合法',e)
      }
    })
    if(!this.interceptRequest){
      UI_RequestHeader_Content.setAttribute('disabled','')
    }else{
      xhr._whenSend(()=>{
        UI_RequestHeader_Content.setAttribute('disabled','')
      })
    }
    UI_RequestHeader.appendChild(UI_RequestHeader_Content)

    UI_RequestHeader_Title.addEventListener('click',()=>{
      
      if(UI_RequestHeader_Content.style.display === 'none'){
        UI_RequestHeader_Content.style.display = 'block'
      }else{
        UI_RequestHeader_Content.style.display = 'none'
      }
    })


    UI_Item.appendChild(UI_RequestHeader)
  }

  addRequestBodyUI(xhr,UI_Item){
    if(!xhr.xhrInterceptor.body){
      return
    }
    const UI_RequestBody = unsafeWindow.document.createElement('div')
    UI_RequestBody.style = 'background-color: #aaa;padding: 5px;'
    const UI_RequestBody_Title = unsafeWindow.document.createElement('div')
    UI_RequestBody_Title.style="cursor: pointer;"
    UI_RequestBody.appendChild(UI_RequestBody_Title)
    UI_RequestBody_Title.innerHTML="RequestBody"
    let UI_RequestBody_Content
    switch(typeof xhr.xhrInterceptor.body){
      case 'string':
        UI_RequestBody_Content = unsafeWindow.document.createElement('textarea')
        try{
          const obj = JSON.parse(xhr.xhrInterceptor.body)
          UI_RequestBody_Content.value = JSON.stringify(obj,null,4)
        }catch(e){
          UI_RequestBody_Content.value = xhr.xhrInterceptor.body
        }
        UI_RequestBody_Content.addEventListener('input',()=>{
          xhr.xhrInterceptor.body = UI_RequestBody_Content.value
        })
        break
      case 'object':
        if(xhr.xhrInterceptor.body instanceof FormData){
          UI_RequestBody_Content = unsafeWindow.document.createElement('div')
          UI_RequestBody_Content.innerHTML = "is FromData"
        }else{
          try{
            UI_RequestBody_Content = unsafeWindow.document.createElement('textarea')
            UI_RequestBody_Content.value = JSON.stringify(xhr.xhrInterceptor.body,null,4)
            UI_RequestBody_Content.addEventListener('input',()=>{
              xhr.xhrInterceptor.body = JSON.parse(UI_RequestBody_Content.value)
            })
          }catch(e){
            UI_RequestBody_Content = unsafeWindow.document.createElement('div')
            console.error("格式化body错误",xhr.xhrInterceptor.body)
            UI_RequestBody_Content.innerHTML = "格式化body错误"
          }
        }
        break
      default:
        UI_RequestBody_Content = unsafeWindow.document.createElement('div')
        UI_RequestBody_Content.innerHTML="body type is unsupport"
    }
    UI_RequestBody_Content.style="display:none;min-width: 100%;max-width: 100%;height:110px"
    if(!this.interceptRequest){
      UI_RequestBody_Content.setAttribute('disabled','')
    }else{
      xhr._whenSend(()=>{
        UI_RequestBody_Content.setAttribute('disabled','')
      })
    }
    UI_RequestBody.appendChild(UI_RequestBody_Content)
    UI_RequestBody_Title.addEventListener('click',()=>{
      if(UI_RequestBody_Content.style.display === 'none'){
        UI_RequestBody_Content.style.display = 'block'
      }else{
        UI_RequestBody_Content.style.display = 'none'
      }
    })
    UI_Item.appendChild(UI_RequestBody)
  }

  addRequestController(xhr,UI_Item){
    const UI_RequestController = unsafeWindow.document.createElement('div')
    const UI_RequestController_Button = unsafeWindow.document.createElement('button')
    UI_RequestController_Button.type="button"
    UI_RequestController_Button.innerHTML = "放行请求"
    UI_RequestController_Button.addEventListener('click',()=>{
      UI_RequestController.remove()
      xhr._send()
    })
    UI_RequestController.appendChild(UI_RequestController_Button)
    UI_Item.appendChild(UI_RequestController)

  }

  addResponseHeaderUI(xhr,UI_Item){
    if(Object.keys(xhr.xhrInterceptor.responseHeaders).length === 0){
      return
    }
    const UI_ResponseHeader = unsafeWindow.document.createElement('div')
    UI_ResponseHeader.style = 'background-color: #aaa;padding: 5px;'
    const UI_ResponseHeader_Title = unsafeWindow.document.createElement('div')
    UI_ResponseHeader_Title.style="cursor: pointer;"
    UI_ResponseHeader.appendChild(UI_ResponseHeader_Title)
    UI_ResponseHeader_Title.innerHTML="ResponseHeader"
    const UI_ResponseHeader_Content = unsafeWindow.document.createElement('textarea')
    UI_ResponseHeader_Content.style="display:none;min-width: 100%;max-width: 100%;height:110px"
    UI_ResponseHeader_Content.value=JSON.stringify(xhr.xhrInterceptor.responseHeaders,null,4)
    UI_ResponseHeader_Content.addEventListener('input',()=>{
      try{
        xhr.xhrInterceptor.responseHeaders = JSON.parse(UI_ResponseHeader_Content.value)
      }catch(e){
        console.error('响应头输入不合法',e)
      }
    })
    if(!this.interceptResponse){
      UI_ResponseHeader_Content.setAttribute('disabled','')
    }else{
      xhr._whenAdopt(()=>{
        UI_ResponseHeader_Content.setAttribute('disabled','')
      })
    }
    UI_ResponseHeader.appendChild(UI_ResponseHeader_Content)

    UI_ResponseHeader_Title.addEventListener('click',()=>{
      
      if(UI_ResponseHeader_Content.style.display === 'none'){
        UI_ResponseHeader_Content.style.display = 'block'
      }else{
        UI_ResponseHeader_Content.style.display = 'none'
      }
    })

    UI_Item.appendChild(UI_ResponseHeader)
  }

  addResponseBodyUI(xhr,UI_Item){
    if(xhr.responseType !== 'text' && xhr.responseType !== ""){
      return
    }
    const UI_ResponseBody = unsafeWindow.document.createElement('div')
    UI_ResponseBody.style = 'background-color: #aaa;padding: 5px;'
    const UI_ResponseBody_Title = unsafeWindow.document.createElement('div')
    UI_ResponseBody_Title.style="cursor: pointer;"
    UI_ResponseBody.appendChild(UI_ResponseBody_Title)
    UI_ResponseBody_Title.innerHTML="ResponseBody"
    const UI_ResponseBody_Content = unsafeWindow.document.createElement('textarea')
    UI_ResponseBody_Content.style="display:none;min-width: 100%;max-width: 100%;height:110px"
    try{
      UI_ResponseBody_Content.value=JSON.stringify(JSON.parse(xhr.xhrInterceptor.responseText),null,4)
    }catch(e){
      UI_ResponseBody_Content.value=xhr.xhrInterceptor.responseText
    }
    UI_ResponseBody_Content.addEventListener('input',()=>{
      xhr.xhrInterceptor.responseText = UI_ResponseBody_Content.value
    })
    if(!this.interceptResponse){
      UI_ResponseBody_Content.setAttribute('disabled','')
    }else{
      xhr._whenAdopt(()=>{
        UI_ResponseBody_Content.setAttribute('disabled','')
      })
    }
    UI_ResponseBody.appendChild(UI_ResponseBody_Content)

    UI_ResponseBody_Title.addEventListener('click',()=>{
      
      if(UI_ResponseBody_Content.style.display === 'none'){
        UI_ResponseBody_Content.style.display = 'block'
      }else{
        UI_ResponseBody_Content.style.display = 'none'
      }
    })

    UI_Item.appendChild(UI_ResponseBody)

  }

  addResponseController(xhr,UI_Item){
    const UI_ResponseController = unsafeWindow.document.createElement('div')
    const UI_ResponseController_Button = unsafeWindow.document.createElement('button')
    UI_ResponseController_Button.type="button"
    UI_ResponseController_Button.innerHTML = "放行响应"
    UI_ResponseController_Button.addEventListener('click',()=>{
      if(xhr.isLoad){
        UI_ResponseController.remove()
        xhr._adoptResponse()
      }
    })
    UI_ResponseController.appendChild(UI_ResponseController_Button)
    UI_Item.appendChild(UI_ResponseController)
  }

}

const UI = new InterceptorUI()

unsafeWindow.XMLHttpRequest = class XHRInterceptor extends XMLHttpRequest{
  constructor(){
    super()
    this.responseListeners = []  // 用户绑定的listener
    this.sendListeners = []
    this.loadListeners = []
    this.adoptListeners = []  // 插件内部使用的listener
    this.isLoad = false
  }
  open(method,url){
    this.xhrInterceptor = {
      id: (new Date()).valueOf(),
      method,
      url,
      requestHeaders: {},
      body: undefined,
      responseHeaders: {},
      responseText:""
    }
  }
  setRequestHeader(name,value){
    this.xhrInterceptor.requestHeaders[name] = value
  }
  getAllResponseHeaders(){
    let str = ""
    for(let key in this.xhrInterceptor.responseHeaders){
      str += `${key}:${this.xhrInterceptor.responseHeaders[key]}\n`
    }
    return str
  }
  getResponseHeader(name){
    return this.xhrInterceptor.responseHeaders[name]
  }
  send(body){
    this.xhrInterceptor.body = body
    UI.addXHR(this)
  }
  _send(){
    this.sendListeners.forEach((listener)=>{
      listener()
    })
    super.open(this.xhrInterceptor.method,this.xhrInterceptor.url)
    for(let name in this.xhrInterceptor.requestHeaders){
      super.setRequestHeader(name,this.xhrInterceptor.requestHeaders[name])
    }
    super.addEventListener('load',(event)=>{
      this.isLoad = true
      if(this.responseType === 'text' || this.responseType === ''){
        this.xhrInterceptor.responseText = super.responseText
      }
      
      const responseHeadersText = this._getAllResponseHeaders()
      responseHeadersText.split('\n').forEach((line)=>{
        const [key,value] = line.split(':')
        if(key){
          this.xhrInterceptor.responseHeaders[key] = value
        }
      })
      this.loadListeners.forEach((handle)=>{
        handle()
      })
    })
    super.send(this.xhrInterceptor.body)
  }

  _adoptResponse(){
    if(this.isLoad){
      this.responseListeners.forEach((handle)=>{
        handle()
      })
      this.adoptListeners.forEach((handle)=>{
        handle()
      })
    }
  }

  _getAllResponseHeaders(){
    return super.getAllResponseHeaders()
  }

  _whenSend(listener){
    this.sendListeners.push(listener)
  }
  _whenLoad(listener){
    this.loadListeners.push(listener)
  }

  _whenAdopt(listener){
    this.adoptListeners.push(listener)
  }

  addEventListener(type,listener){
    super.addEventListener(type,(event)=>{
      if(typeof listener === 'function'){
        if((type === 'readystatechange' && this.readyState === 4) || type === 'load'){
          this.responseListeners.push(()=>{
            listener.call(this,event)
          })
        }else{
          listener.call(this,event)
        }
      }
    })
  }

  _addEventListener(type,listener){
    super.addEventListener(type,listener)
  }

  set onload(listener){
    this.addEventListener('load',listener)
  }
  set onloadend(listener){
    this.addEventListener('loadend',listener)
  }
  set onreadystatechange(listener){
    this.addEventListener('readystatechange',listener)
  }
  get responseText(){
    return this.xhrInterceptor.responseText
  }

  get response(){
    if(this.responseType === 'text'){
      return this.xhrInterceptor.responseText
    }else{
      return super.response
    }
  }

}
