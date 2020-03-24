// 获取目录
const fs = require('fs')
const path = require('path')

const root = (p) => {
  return path.resolve(__dirname, `../../${p}`)
}
let arr = (p) => {
  return fs.readdirSync(root(p), function (err, files) {
    if (err) {
      console.log(err);
    }
    return files
  })
}

module.exports = arr
