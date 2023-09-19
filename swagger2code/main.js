// ==UserScript==
// @name         swagger文档生成代码
// @namespace    swagger2code
// @version      0.1
// @description  一键复制swagger文档代码
// @author       You
// @match        https://*/doc.html
// @match        http://*/doc.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=16.93
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
  'use strict'

  const Config = {
    deletePrefix: localStorage.deletePrefix
  }

  const tranHandler = {
    path: (path) => { return path }
  }

  function useTranHandler(handlerName, value, args) {
    if (tranHandler[handlerName]) {
      return tranHandler[handlerName](value, args)
    } else {
      return value
    }
  }

  const axios = function(config) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open(config.method, config.url)
      xhr.onload = (e) => {
        resolve({
          data: JSON.parse(xhr.responseText)
        })
      }
      xhr.send()
    })
  }

  function pathToApiName(path) {
    let result = ''
    let needUpperCase = false
    for (const char of path) {
      if (['/', '-', '_'].includes(char)) {
        needUpperCase = true
      } else {
        result += (needUpperCase ? char.toUpperCase() : char)
        needUpperCase = false
      }
    }
    result = `${result[0].toLowerCase()}${result.slice(1)}`
    return result
  }

  const fileTemplate = `/**
  * 该文件自动生成，勿手动修改(修改了也会被覆盖
  */

  import request from '@/utils/request'
`
  const functionCodeGener = function(meta) {
    const functionParams = []
    if (Array.isArray(meta.params) && meta.params.length > 0) {
      functionParams.push('params')
    }
    if (Array.isArray(meta.data) && meta.data.length > 0) {
      functionParams.push('data')
    }
    if (Array.isArray(meta.formData) && meta.formData.length > 0) {
      functionParams.push('formData')
    }
    let comment = ''
    if (meta.name) {
      comment += '\n  * ' + meta.name
    }
    if (meta.comment) {
      comment += '\n  * ' + meta.comment
    }
    if (meta.tags) {
      comment += '\n  * ' + meta.tags.join('、')
    }

    let paramsComment = ''
    if (Array.isArray(meta.params) && meta.params.length > 0 && meta.params.length < 5) {
      for (const param of meta.params) {
        paramsComment += `\n  * ${param.required ? '@required ' : ''}@param {${param.schema.type}} params.${param.name} - ${param.description}`
      }
    }
    let bodyComment = ''
    if (Array.isArray(meta.data) && meta.data.length > 0) {
      if (meta.data.length < 5) {
        for (const item of meta.data) {
          bodyComment += `\n  * ${item.required ? '@required ' : ''}@param {${item.type}} data.${item.name} - ${item.description}`
        }
      } else {
        bodyComment += `\n  * @param {${meta.dataRef}} data`
      }
    }
    const link = `\n  * {@link ${location.origin}${location.pathname}#/${meta.moduleName}/${meta.tags ? (meta.tags[0] + '/') : ''}${meta.operationId}}`
    return `
/**${comment}${paramsComment}${bodyComment}${link}
  */
export function ${meta.apiName}(${functionParams.join(', ')}) {
  return request({
    method: '${meta.method}',
    url: '${meta.path}'${meta.requestType ? ',\n    requestType: \'' + meta.requestType + '\'' : ''}${functionParams.includes('params') ? ',\n    params' : ''}${functionParams.includes('data') || functionParams.includes('formData') ? ',\n    data' + (functionParams.includes('formData') ? ': formData' : '') : ''}
  })
}
`
  }

  function createByModule(module) {
    const metas = []
    return axios({
      url: module.url,
      method: 'get'
    }).then((res) => {
      const { components, paths } = res.data
      const { schemas } = components
      for (const path in paths) {
        let _path = path
        if (Config.deletePrefix) {
          _path = _path.replace(Config.deletePrefix, '')
        }
        for (const method in paths[path]) {
          const item = paths[path][method]
          let dataRef = item.requestBody?.content['application/json'].schema['$ref'] || ''
          if (dataRef) {
            dataRef = dataRef.slice(dataRef.lastIndexOf('/') + 1)
          }
          metas.push({
            moduleName: module.name,
            operationId: item.operationId,
            apiName: useTranHandler('name', pathToApiName(_path)),
            path: useTranHandler('path', _path),
            name: item.summary,
            comment: item.description,
            params: item.parameters?.filter((item) => {
              return item.in === 'query'
            }),
            method,
            dataRef,
            data: schemas[dataRef] ? Object.keys(schemas[dataRef].properties).map((key) => {
              return {
                ...schemas[dataRef].properties[key],
                required: schemas[dataRef].required?.includes(key) || false,
                name: key
              }
            }) : [],
            tags: item.tags
          })
        }
      }
      let text = fileTemplate
      for (const meta of metas.sort((a, b) => { return a.path.localeCompare(b.path) })) {
        text += functionCodeGener(meta)
      }
      return text
    })
  }

  function getCurrentModule() {
    const swaggerCurrentInstance = document.querySelector('#app')?.__vue__?.$store?.state?.globals?.swaggerCurrentInstance
    return {
      url: swaggerCurrentInstance?.url,
      name: swaggerCurrentInstance?.name
    }
  }

  function installBtn() {
    const btn = document.createElement('button')
    btn.innerHTML = '复制接口代码'
    document.querySelector('.header .right').appendChild(btn)
    btn.addEventListener('click', () => {
      const module = getCurrentModule()
      createByModule(module).then((text) => {
        GM_setClipboard(text, 'text')
        alert('复制成功')
      })
    })

    const btn2 = document.createElement('button')
    btn2.innerHTML = '设置删除前缀'
    document.querySelector('.header .right').appendChild(btn2)
    btn2.addEventListener('click', () => {
      const deletePrefix = prompt()
      Config.deletePrefix = deletePrefix
      localStorage.deletePrefix = deletePrefix
    })
  }
  const timer = setInterval(() => {
    const { name, url } = getCurrentModule()
    if (name && url) {
      clearInterval(timer)
      installBtn()
    }
  }, 1000)
})()
