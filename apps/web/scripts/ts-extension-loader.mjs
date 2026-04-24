import { resolve as resolvePath } from 'node:path'
import { pathToFileURL } from 'node:url'

const srcRoot = resolvePath(process.cwd(), 'src')

export async function resolve(specifier, context, nextResolve) {
  const normalizedSpecifier = specifier.startsWith('@/')
    ? pathToFileURL(resolvePath(srcRoot, specifier.slice(2))).href
    : specifier === 'next/headers'
      ? 'next/headers.js'
      : specifier === 'next/server'
        ? 'next/server.js'
        : specifier

  try {
    return await nextResolve(normalizedSpecifier, context)
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || (!specifier.startsWith('.') && !specifier.startsWith('@/'))) {
      throw error
    }

    return nextResolve(`${normalizedSpecifier}.ts`, context)
  }
}
