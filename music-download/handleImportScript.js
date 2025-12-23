#!/usr/bin/env node

/**
 * 自定义音乐源导入脚本
 * 支持本地文件导入和在线URL导入
 * 导入结果直接打印输出而非保存到系统中
 *
 * 使用方法：直接修改源文件路径或URL，然后运行此脚本
 */

// ======== 配置区域 开始 ========
// 修改此处来指定要导入的源文件路径或URL
const SOURCE = './lx音乐源.js'  // 可以是本地路径或网络URL
// ======== 配置区域 结束 ========

const fs = require('fs').promises
const https = require('https')
const http = require('http')
const path = require('path')

// 匹配脚本信息的正则表达式
const matchInfo = (scriptInfo) => {
  const infoArr = scriptInfo.split(/\r?\n/)
  const rxp = /^\s?\*\s?@(\w+)\s(.+)$/
  const INFO_NAMES = {
    name: 24,
    description: 36,
    author: 56,
    homepage: 1024,
    version: 36,
  }
  const infos = {}

  for (const info of infoArr) {
    const result = rxp.exec(info)
    if (!result) continue
    const key = result[1]
    if (INFO_NAMES[key] == null) continue
    infos[key] = result[2].trim()
  }

  for (const [key, len] of Object.entries(INFO_NAMES)) {
    infos[key] ||= ''
    if (infos[key] == null) infos[key] = ''
    else if (infos[key].length > len) infos[key] = infos[key].substring(0, len) + '...'
  }

  return infos
}

// 解析脚本元数据
const parseScriptMetadata = (script) => {
  const result = /^\/\*[\S|\s]+?\*\//.exec(script)
  if (!result) {
    throw new Error('无效的自定义源文件: 缺少注释信息块')
  }

  let scriptInfo = matchInfo(result[0])
  scriptInfo.name ||= `user_api_${new Date().toLocaleString()}`

  const apiInfo = {
    id: `user_api_${Math.random().toString().substring(2, 5)}_${Date.now()}`,
    ...scriptInfo,
    allowShowUpdateAlert: true,
  }

  return apiInfo
}

// 从本地文件导入
const importFromFile = async (filePath) => {
  try {
    console.log(`正在从本地文件导入: ${filePath}`)

    // 检查文件是否存在
    await fs.access(filePath)

    // 读取文件内容
    const script = await fs.readFile(filePath, 'utf8')

    // 解析元数据
    const metadata = parseScriptMetadata(script)

    console.log('✅ 成功解析自定义源:')
    console.log(JSON.stringify(metadata, null, 2))
    console.log('\n📝 脚本预览 (前200字符):')
    console.log(script.substring(0, 200) + (script.length > 200 ? '...' : ''))

    return { metadata, script }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`文件不存在: ${filePath}`)
    }
    throw error
  }
}

// 从URL导入
const importFromUrl = async (url) => {
  console.log(`正在从URL导入: ${url}`)

  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http

    lib.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // 解析元数据
            const metadata = parseScriptMetadata(data)

            console.log('✅ 成功解析自定义源:')
            console.log(JSON.stringify(metadata, null, 2))
            console.log('\n📝 脚本预览 (前200字符):')
            console.log(data.substring(0, 200) + (data.length > 200 ? '...' : ''))

            resolve({ metadata, script: data })
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        }
      })
    }).on('error', (error) => {
      reject(new Error(`网络请求失败: ${error.message}`))
    })
  })
}

// 主函数
const main = async () => {
  try {
    if (SOURCE.startsWith('http://') || SOURCE.startsWith('https://')) {
      // 在线导入
      await importFromUrl(SOURCE)
    } else {
      // 本地文件导入
      const fullPath = path.resolve(SOURCE)
      await importFromFile(fullPath)
    }

    console.log('\n🎉 导入完成！注意：此脚本仅用于测试和验证自定义源，不会保存到系统中。')
  } catch (error) {
    console.error(`❌ 导入失败: ${error.message}`)
    process.exit(1)
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  main()
}

module.exports = {
  importFromFile,
  importFromUrl,
  parseScriptMetadata
}
