/* @flow */

import config from '../config'
import { noop } from 'shared/util'

// 定义 warn，tip 为空函数
export let warn = noop
export let tip = noop
export let generateComponentTrace = (noop: any) // work around flow check
export let formatComponentName = (noop: any)

if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')

  warn = (msg, vm) => {
    // 警告前先生成栈回溯
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace)
    } else if (hasConsole && (!config.silent)) {
      // 这里就是 Vue warn 报错生成的地方
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }

  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      // Vue tip 生成的地方
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

  /**
   * 生成组件名称
   */
  formatComponentName = (vm, includeFile) => {
    if (vm.$root === vm) {
      return '<Root>'
    }
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  const repeat = (str, n) => {
    let res = ''
    while (n) {
      if (n % 2 === 1) res += str
      if (n > 1) str += str
      n >>= 1
    }
    return res
  }

  /**
   * 生成组件回溯
   */
  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      const tree = []
      // 递归序列
      let currentRecursiveSequence = 0
      while (vm) {
        // 当第二次循环发生时，满足 tree.length > 0 的条件
        if (tree.length > 0) {
          // 获取 tree 中最后一个元素
          const last = tree[tree.length - 1]
          // 如果最后一个元素的 constructor 与当前 vm 对象的 constructor 相同
          if (last.constructor === vm.constructor) {
            // 递归序列增加
            currentRecursiveSequence++
            // vm 在此处被赋值为他的父级
            vm = vm.$parent
            // 继续循环
            continue
            // 如果递归序列值 大于 0，并且当前的tree 中最后一个元素的 constructor 与 vm 的 constructor 不同。
          } else if (currentRecursiveSequence > 0) {
            // 那么把 tree 的最后一个元素赋值成 [last, 递归序列值] 这样的结构
            tree[tree.length - 1] = [last, currentRecursiveSequence]
            currentRecursiveSequence = 0
          }
        }
        // 将 vm push 进 tree 数组
        tree.push(vm)
        // 此时将 vm 赋值为它的父级
        vm = vm.$parent
      }
      return '\n\nfound in\n\n' + tree
        .map((vm, i) => `${
          i === 0 ? '---> ' : repeat(' ', 5 + i * 2)
        }${
          Array.isArray(vm)
            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
            : formatComponentName(vm)
        }`)
        .join('\n')
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}
