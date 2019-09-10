const mode = {
  'default': {
    desc: '默认项目打包形式-打包后cdn文件上传服务器，以及pages/项目/index.html'
  },
  'dist': {
    desc: '默认运行打包cli3的运行形式，生成文件dist/css && js && html'
  },
  'noCss': {
    desc: '打包css成一个js文件，不会被code spliting成一个独立的css，一般会减少带宽'
  },
  'noPreload': {
    desc: '打包后文件不会添加preload属性，文件不会预加载, 暂未上线'
  },
  'mult': {
    desc: '打包多页面，要求模式固定，@mult-xx[a, b, c, d]'
  },
  'cdn': {
    desc: '打包js里面剔除vue文件，需要html里面添加vue cdn文件，优点是减少生成js文件的大小'
  },
  'rem': {
    desc: `运行打包的时候自动将px 转换为 rem;自动转化rem 满足三个条件：\n查看readme.md`
  },
  'none': {
    desc: '未定义的模式，建议补充文档 => conf/mode.js  or  readme.md 文件'
  }
}
let model = new Proxy(mode, {
  get: function (target, property) {
    if (property in target) {
      return target[property]
    } else {
      return target['none']
    }
  }
})

module.exports = model
