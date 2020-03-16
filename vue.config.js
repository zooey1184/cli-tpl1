const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ENV = process.env.NODE_ENV || 'production'
const path = require('path')
const { entry, tip } = require('./cli-config/vue.config/entry')
const { publicPath, outputDir } = require('./cli-config/vue.config/output')
const cssFn = require('./cli-config/vue.config/css')
const getAlias = require('./cli-config/vue.config/alias')

let Entry = entry()
let Alias = getAlias(Entry)
tip()
module.exports = {
  publicPath: publicPath(),
  pages: Entry,
  css: cssFn(),
  productionSourceMap: false,
  configureWebpack: config => {
    // 合并别名设置
    Object.assign(config.resolve.alias, Alias)
    if ((ENV === 'production')) {
      // 每次build清理dist文件夹
      config.plugins.push(new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, './dist')]
      }))
      // if (tools.some(POBJ.header, 'cdn')) {
      //   // 满足需要两个条件 一个是html里面有vue cdn文件  一个是开始 @cdn 修饰符
      //   config.externals = {
      //     'vue': 'Vue'
      //   }
      // }
    }
  },
  outputDir: outputDir()
}
