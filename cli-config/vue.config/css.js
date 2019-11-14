const config = require('./../template.json')

const pro = config.usePro
const proObj = config[pro.toString()]
const detail = proObj[proObj.useEnv]

const cssFn = () => {
  let obj = {
    extract: !(detail.decorator && detail.decorator.some(item => item === 'noCss'))
  }
  if (detail.decorator.find(item => item === 'rem')) {
    /*
     * 自动转化rem 满足三个条件
     * 一个是html没有meta viewport
     * main.js 导入 import 'lib-flexible/flexible.js'
     * 修饰符 @rem
     */
    Object.assign(obj, {
      loaderOptions: {
        postcss: {
          plugins: [
            require('postcss-plugin-px2rem')({
              rootValue: 100
            })
          ]
        }
      }
    })
  }
  return obj
}

module.exports = cssFn
