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


(function () {
  'use strict';
  let vue
  const findVueEl = function () {
    const selectors = ['#app', '.app']
    for (const selector of selectors) {
      const el = unsafeWindow.document.querySelector(selector)
      if (el && el.__vue__) {
        vue = el.__vue__
        break
      }
    }
    if (!vue) {
      for (const el of unsafeWindow.document.body.children) {
        if (el && el.__vue__) {
          vue = el.__vue__
          break
        }
      }
    }
    patchVue()
  }
  const patchVue = function () {
    if (vue) {
      let constructor = vue.__proto__.constructor
      let Vue = constructor;
      while (Vue.super) {
        Vue = Vue.super
      }
      if (Vue.config.devtools === false && unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        Vue.config.devtools = true;
        let hook = unsafeWindow.__VUE_DEVTOOLS_GLOBAL_HOOK__
        hook.emit('init', Vue)
        if (vue.$store) {
          let store = vue.$store;
          store._devtoolHook = hook;
          hook.emit('vuex:init', store);
          hook.on('vuex:travel-to-state', function (targetState) {
            store.replaceState(targetState);
          });
          store.subscribe(function (mutation, state) {
            hook.emit('vuex:mutation', mutation, state);
          });
        }
      }
    } else {
      setTimeout(() => {
        findVueEl()
      }, 1000)
    }
  }
  findVueEl()
})();
