/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // TODO: 生成 ast 树
  const ast = parse(template.trim(), options)

  // TODO: optimize 逻辑未看
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  // TODO: generate 逻辑未看
  const code = generate(ast, options)

  // baseCompile 函数，返回以下对象
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
