// ==UserScript==
// @name         强制打开vue调试模式
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @match        http://*/*
// @run-at       document-end
// @grant        unsafeWindow
// ==/UserScript==

(function() {
  'use strict'
  let vue
  const findVueEl = function() {
    if (!unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      setTimeout(() => {
        findVueEl()
      }, 1000)
      return
    }
    const selectors = ['#app', '.app']
    for (const selector of selectors) {
      const el = unsafeWindow.document.querySelector(selector)
      if (el) {
        vue = el.__vue__ || el.__vue_app__
      }
      if (vue) {
        break
      }
    }
    if (!vue) {
      for (const el of unsafeWindow.document.body.children) {
        vue = el.__vue__ || el.__vue_app__
        if (vue) {
          break
        }
      }
    }
    patchVue()
  }
  const patchVue = function() {
    if (vue) {
      const constructor = vue.__proto__.constructor
      let Vue = constructor
      while (Vue.super) {
        Vue = Vue.super
      }
      const isVue3 = vue.version
      if (isVue3 ? vue.config.devtools : Vue.config.devtools) {
        return
      }
      console.log('try open vue devtools')
      if (isVue3) {
        vue.config.devtools = true
      } else {
        unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = Vue
        Vue.config.devtools = true
      }
      const hook = unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__
      if (unsafeWindow.__NUXT__ || unsafeWindow.$nuxt) {
        unsafeWindow.postMessage(
          {
            devtoolsEnabled: true,
            vueDetected: true,
            nuxtDetected: true
          },
          '*'
        )
      }
      if (isVue3) {
        unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__.enabled = true
        unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps.push({
          app: vue,
          version: vue.version,
          types: {
            Comment: Symbol('Comment'),
            Fragment: Symbol('Fragment'),
            Static: Symbol('Static'),
            Text: Symbol('Text')
          }
        })
        unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__.enabled = true
        unsafeWindow.postMessage(
          {
            devtoolsEnabled: true,
            vueDetected: true
          },
          '*'
        )
      } else {
        if (Vue.config.devtools === false) {
          Vue.config.devtools = true
          hook.emit('init', Vue)
          if (vue.$store) {
            const store = vue.$store
            store._devtoolHook = hook
            hook.emit('vuex:init', store)
            hook.on('vuex:travel-to-state', function(targetState) {
              store.replaceState(targetState)
            })
            store.subscribe(function(mutation, state) {
              hook.emit('vuex:mutation', mutation, state)
            })
          }
        }
      }
    } else {
      setTimeout(() => {
        findVueEl()
      }, 1000)
    }
  }
  findVueEl()
})()
