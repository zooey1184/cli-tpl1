const path = require('path')
const configRes = require('./../index')

/**
 * 自定义别名 @/当前项目  作为入口别名
 * exp：@/index  表示 src 下的项目入口
 * @/index/components/test/index.vue => src/pages/index/components/test/index.vue
 * @param {*} entry => 入口entry
 */

const getEntry = (entry) => {
  let obj = {}
  let aliasPrefix = '@'
  for (let i in entry) {
    let a = `${aliasPrefix}${i}`
    let ap = path.resolve(__dirname, `./../../${configRes.baseUrl}/${i}`)
    obj[a] = ap
  }
  return obj
}

module.exports = getEntry
