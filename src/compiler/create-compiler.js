/* @flow */

import { extend } from 'shared/util'
import { detectErrors } from './error-detector'
import { createCompileToFunctionFn } from './to-function'

export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {
    function compile (
      template: string,
      options?: CompilerOptions
    ): CompiledResult {
      // 以 baseOptions 为原型，创建 finalOptions 对象
      const finalOptions = Object.create(baseOptions)
      const errors = []
      const tips = []

      // 按是否存在 tip，区分是报错还是 tip
      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg)
      }

      if (options) {
        // 非生产环境下，重新定义 warn 报错
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length

          warn = (msg, range, tip) => {
            const data: WarningMessage = { msg }
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : errors).push(data)
          }
        }
        // merge custom modules
        // 存在 module，merge modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // copy other options
        // copy 除 modules 和 directives 以外的其他选项
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }

      finalOptions.warn = warn

      // 使用传入的 baseCompile 函数，编译模板
      const compiled = baseCompile(template.trim(), finalOptions)
      if (process.env.NODE_ENV !== 'production') {
        // 检查模板中是否存在有问题的表达式
        detectErrors(compiled.ast, warn)
      }
      compiled.errors = errors
      compiled.tips = tips

      // compile 函数，返回 compiled 对象
      return compiled
    }

    // createCompilerCreator 函数，返回 createCompile 的命名函数
    // 返回值为包含 compile 函数以及 compileToFunctions 的函数对象
    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
