const tplObj = require(`${__dirname}/../template`)
const useDir = process.env.dir || 'pages'
const usePro = tplObj.usePro
const useEnv = tplObj[tplObj.usePro].useEnv
const dealPath2Config = (localPath) => {
  let s = localPath === 'dist' ? `src/${useDir}/${usePro}`.split('/') : localPath.split('/')
  let [ss, dd, ...pp] = s
  return {
    src: ss,
    dir: dd,
    pro: pp.join('/'),
    usePro: `${dd}__${pp.join('/')}`
  }
}

const dealConfig2Path = (name) => {
  let t = name.split('__')
  if(t.length > 0) {
    return {
      dir: t[0],
      pro: t[1]
    }
  } else {
    return {
      dir: 'pages',
      pro: t[0]
    }
  }
}

module.exports = {
  dealPath2Config,
  dealConfig2Path,
  useEnv
}
