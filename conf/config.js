const pro = process.env.pro
const env = process.env.NODE_ENV

const runPath = './src/pages'
const buildPath = './dist'
const webPath = 'jr/webpublic' // 这个配置和upload的webpath应该是一致的
const wP = 'webpublic'
const cdn = `https://xxx`
const cdnlc = `https://cdnxxx`
// cdn指定资源中间路径匹配
const cndLink = {
  a: '/a/',
}
// 修饰符组合
const cliGroup = {
  g: ['noCss', 'rem', 'dist'] // @g == @dist@rem@noCss
}

module.exports = {
  pro,
  env,
  runPath,
  buildPath,
  cdn,
  cdnlc,
  cndLink,
  cliGroup
}
