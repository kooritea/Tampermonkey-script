// ==UserScript==
// @name         swagger文档生成代码
// @namespace    swagger2code
// @version      0.1
// @description  一键复制swagger文档代码
// @author       You
// @match        https://*/*doc.html
// @match        http://*/*doc.html
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
      xhr.open(config.method, location.pathname.replace(/\/doc.html$/, '') + config.url)
      xhr.onload = (e) => {
        resolve({
          data: JSON.parse(xhr.responseText)
        })
      }
      xhr.send()
    })
  }

  function typeFormatter(type) {
    return {
      'integer': 'number'
    }[type] || type
  }

  function pathToApiName(path) {
    path = path.replace(/\/{(.*?)}/g, '/$1')
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

  function pathToParamsPath(path) {
    return path.replace(/\/{(.*?)}/g, '/${pathParams.$1}')
  }

  function createResponseInterfaceTemplate(interfaceMeta, schemas) {
    // if (!interfaceMeta.properties.data.originalRef) {
    //   console.log(interfaceMeta)
    //   return {}
    // }
    const rootType = interfaceMeta.properties.data.type
    const { properties, title } = rootType === 'array' ? schemas[interfaceMeta.properties.data.items.originalRef] : schemas[interfaceMeta.properties.data.originalRef]
    let property = ''
    for (const key in properties) {
      property += `\n  * @property {${typeFormatter(properties[key].type)}} ${key} - ${properties[key].description}`
    }
    const _title = title.replaceAll(/-/g, '_')
    return {
      type: rootType,
      name: _title,
      template: `\n/**
  * @typedef {Object} ${_title}${property}
  */`
    }
  }

  const fileTemplate = `/**
  * 该文件自动生成，勿手动修改(修改了也会被覆盖
  */

  import request from '@/utils/request'
`
  const functionCodeGener = function(meta) {
    let interfaceComment = ``
    const functionParams = []
    if (Array.isArray(meta.pathParams) && meta.pathParams.length > 0) {
      functionParams.push('pathParams')
    }
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

    let pathParamsComment = ''
    if (Array.isArray(meta.pathParams) && meta.pathParams.length > 0 && meta.pathParams.length < 5) {
      for (const param of meta.pathParams) {
        pathParamsComment += `\n  * ${param.required ? '@required ' : ''}@param {${param.type || param.schema.type}} pathParams.${param.name} - ${param.description}`
      }
    }

    let paramsComment = ''
    if (Array.isArray(meta.params) && meta.params.length > 0 && meta.params.length < 5) {
      for (const param of meta.params) {
        paramsComment += `\n  * ${param.required ? '@required ' : ''}@param {${param.type || param.schema?.type || param.items?.additionalProperties?.type}} params.${param.name} - ${param.description}`
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
    let returnComment = ''
    if (meta.response) {
      const { type, template, name } = createResponseInterfaceTemplate(meta.response, meta.schemas)
      if (template) {
        if (type === 'array') {
          returnComment = `\n  * @return {Promise<Array<${name}>>}`
        } else {
          returnComment = `\n  * @return {Promise<${name}>}`
        }
        interfaceComment += template
      }
    }
    const link = `\n  * @link ${location.origin}${location.pathname}#/${meta.moduleName}/${meta.tags ? (meta.tags[0] + '/') : ''}${meta.operationId}`
    return `${interfaceComment}
/**${comment}${pathParamsComment}${paramsComment}${bodyComment}${link}${returnComment}
  */
export function ${meta.apiName}(${functionParams.join(', ')}) {
  return request({
    method: '${meta.method}',
    url: \`${meta.path}\`${meta.requestType ? ',\n    requestType: \'' + meta.requestType + '\'' : ''}${functionParams.includes('params') ? ',\n    params' : ''}${functionParams.includes('data') || functionParams.includes('formData') ? ',\n    data' + (functionParams.includes('formData') ? ': formData' : '') : ''}
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
      const { components = {}, definitions = {}, paths } = res.data
      const schemas = components.schemas || definitions
      for (const path in paths) {
        let _path = path
        if (Config.deletePrefix) {
          _path = _path.replace(Config.deletePrefix, '')
        }
        for (const method in paths[path]) {
          let requestType
          const item = paths[path][method]
          const params = []
          params.push(...(item.parameters?.filter((item) => {
            return item.in === 'query'
          }) || []))
          const pathParams = []
          pathParams.push(...(item.parameters?.filter((item) => {
            return item.in === 'path'
          }) || []))
          if (item.requestBody?.content['application/json']?.schema?.properties) {
            const properties = item.requestBody?.content['application/json']?.schema?.properties
            params.push(...Object.keys(properties).map((key) => {
              return {
                description: properties[key].description,
                name: key,
                in: 'query',
                required: properties[key].required ?? false,
                schema: {
                  description: properties[key].description,
                  type: properties[key].type
                }
              }
            }))
          }
          const data = []
          let dataRef = item.requestBody?.content['application/json'].schema['$ref'] || item.requestBody?.content['application/json']?.schema?.items?.['$ref'] || ''
          if (!dataRef) {
            dataRef = item.parameters?.find((item) => {
              return item.in === 'body'
            })?.schema?.['$ref']
          }
          if (dataRef) {
            dataRef = dataRef.slice(dataRef.lastIndexOf('/') + 1)
            data.push(...(schemas[dataRef] ? Object.keys(schemas[dataRef].properties).map((key) => {
              return {
                ...schemas[dataRef].properties[key],
                required: schemas[dataRef].required?.includes(key) || false,
                name: key
              }
            }) : []))
          }
          const formData = []
          for (const formDataItem of (item.parameters?.filter((item) => {
            return item.in === 'formData'
          }) || [])) {
            formData.push(formDataItem)
            requestType = 'formData'
          }

          const response = schemas[item.responses['200'].schema.originalRef]

          metas.push({
            moduleName: module.name,
            operationId: item.operationId,
            apiName: useTranHandler('name', pathToApiName(_path)),
            path: useTranHandler('path', pathToParamsPath(_path)),
            name: item.summary,
            comment: item.description,
            params: params.filter((item) => {
              return item
            }),
            pathParams: pathParams.filter((item) => {
              return item
            }),
            method,
            dataRef,
            data,
            formData,
            requestType,
            tags: item.tags,
            schemas,
            response
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
