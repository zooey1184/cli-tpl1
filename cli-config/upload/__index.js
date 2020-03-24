const { deployMult, deploySingle, deployMultFromConfig } = require('./_index')
const [, , ...args] = process.argv

// 使用匹配模式 查找本地配置 默认除了dist的配置外全部输出
const matchType = () => {
  let len = args.length
  let arr1 = args[0].split('=')
  if(len > 1) {
    let arr2 = args[1]
    if(arr2.match(/^(and|or)$/)) {
      deployMultFromConfig(arr1[1], arr2)
    } else {
      deployMultFromConfig(arr1[1])
    }
  } else {
    arr1.length > 1 ? deployMultFromConfig(arr1[1]) : deployMultFromConfig()
  }
}

if(args.length > 0) {
  let arr1 = args[0].split('=')
  let type = arr1[0]
  switch (type) {
    case 'fold':
      arr1.length > 1 ? deployMult(arr1[1]) : deployMult()
      break;
    case 'path':
      arr1.length > 1 ? deploySingle(arr1[1]) : deploySingle()
      break;
    case 'match':
      matchType()
      break;
    default:
      deploySingle()
      break;
  }
} else {
  deploySingle()
}
