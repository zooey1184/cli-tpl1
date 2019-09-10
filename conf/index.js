const chalk = require('chalk')
const mode = require('./mode')
const conf = require('./entry')
const tools = require('./tools')
const config = require('./config')

const proENV = config.env
const pro = config.pro
const POBJ = tools.decorator(pro)
/**
 * 是否打包到dist 默认false
 */
const dist = tools.some(POBJ.header, 'dist')
// 是否有存在打包本地的url设置
function basehref (type) {
  let t = type.split('_')
  let l = t.length
  if (/_path_/.test(type)) { // 适用项目路径比较短的项目
    let tt = t.splice(2).join('_')
    return `/${tt}/`
  } else {
    let p = config.cndLink
    if (p[t[l - 1]]) {
      return p[t[l - 1]]
    } else {
      console.error('basehref 设置有问题')
      return '/'
    }
  }
}
let pubUrl = () => {
  if (tools.find(POBJ.header, 'base_')) {
    let a = tools.find(POBJ.header, 'base_')
    return basehref(a)
  } else {
    return ''
  }
}

const findMult = tools.find(POBJ.header, 'mult')
const MultMiddleSplit = '-'
const entryFn = () => {
  let n = POBJ.body
  let obj = {}
  let htmlName = 'index'
  if (tools.find(POBJ.header, 'html')) {
    htmlName = tools.find(POBJ.header, 'html').split('_')[1]
  }
  if (n.length < 2) {
    obj = {
      entry: conf.single(POBJ.body[0], dist, htmlName),
      action: 'single',
      header: POBJ.header,
      body: POBJ.body
    }
  } else {
    if (findMult) {
      let hd = findMult
      let arr = hd.split(MultMiddleSplit)
      let len = arr.length
      let pre = arr[len - 1]
      obj = {
        entry: conf.mult(pre, POBJ.body, dist),
        action: 'mult',
        header: POBJ.header,
        body: POBJ.body
      }
    } else {
      console.log(chalk.blue('需要设置修饰符 @mult 为多页面'))
    }
  }
  return obj
}

let modeFn = () => {
  let arr = POBJ.header
  let hd = findMult
  arr = arr.map(item => {
    return item === hd ? 'mult' : item
  })
  arr.map(item => {
    console.log(chalk.bgMagentaBright(`修饰符：${item}\n`))
    console.log(chalk.blue(`${mode[item].desc}\n\n`))
  })
}
let tip = () => {
  if (proENV === 'production') {
    console.log(chalk.green(`正在打包: ${POBJ.body}\n\n`))
    modeFn()
  } else {
    console.log(chalk.green(`正在启动: ${POBJ.body}\n\n`))
  }
}

/**
 * 获取中间路径 即设置的路径
 */
function middlePath () {
  if (tools.find(POBJ.header, 'mult')) {
    let hd = tools.find(POBJ.header, 'mult')
    let arr = hd.split(MultMiddleSplit)
    let len = arr.length
    let pre = arr[len - 1]
    return pre
  } else {
    return POBJ.body[0]
  }
}
/**
 * baseUrl
 * @param {boolean} [dist=false] 项目是否打包到dist
 * @param {string} [distUrl=''] 若打包到dist 则dist的cdn的路径是什么（为了兼容router不太友好的支持多页面以及history模式）
 * @returns
 */
function baseUrlFn (dist = false, distUrl = '') {
  if (dist) {
    return distUrl
  }
  if (proENV === 'production') {
    let mid = middlePath()
    let cdnlc = tools.some(POBJ.header, 'cdnlc')
    if (cdnlc) {
      return `${config.cdnlc}/${mid}`
    }
    return `${config.cdn}/${mid}`
  } else {
    return '/'
  }
}
function outPutDir () {
  if (dist) {
    return 'dist'
  } else {
    let mid = middlePath()
    return `dist/${mid}`
  }
}
// css 规则
function cssFn () {
  let obj = {
    extract: !tools.some(POBJ.header, 'noCss')
  }
  if (tools.some(POBJ.header, 'rem')) {
    // 自动转化rem 满足三个条件
    // 一个是html没有meta viewport
    // main.js 导入 import 'lib-flexible/flexible.js'
    // 修饰符@rem
    Object.assign(obj, {
      loaderOptions: {
        postcss: {
          plugins: [
            require('postcss-px2rem')({
              remUnit: 54
            }) // 换算的基数
          ]
        }
      }
    })
  }
  return obj
}

module.exports = {
  tip: tip,
  entry: entryFn,
  publicPath: baseUrlFn,
  cdnPath: pubUrl,
  dist: dist,
  outPutDir: outPutDir,
  css: cssFn
}
