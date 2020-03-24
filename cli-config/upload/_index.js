const inquirer = require('inquirer')
const fs = require('fs')
const deploy = require('./deploy')
const buildConfig = require(`${__dirname}/../template`)
const uploadConfigJSON = `${__dirname}/template.json`
const uploadConfigJS = require(`./template`)
const useEnv = buildConfig[buildConfig.usePro].useEnv
const sshObj = require('./sshConfig')
const { bgYellowLog, errorLog } = require('../tools/log')
const getDir = require('./getDir')
const { dealPath2Config } = require('./localPath')
let { questions, envQuestions, proChoices } = require('./question')

// 询问部署配置
const ask = async (pro, env, cb = () => {}, questionsHook) => {
  // 设置问题，以及如果有固定配置则忽略部分选项
  let username;
  let password;
  questions.forEach(item => {
    if (item.name === 'username' || item.name === 'password') {
      item.when = (e) => {
        let b = true
        for (let i in sshObj) {
          if (sshObj[i].h === e.host) {
            username = username || sshObj[i].u
            password = password || sshObj[i].p
            b = false
          }
        }
        return b
      }
    }
  })
  if (questionsHook) {
    questions = questionsHook(questions)
  }
  let ans = await inquirer.prompt(questions)
  if (!ans.username) {
    ans.username = username
  }
  if (!ans.password) {
    ans.password = password
  }
  if (!ans.name.trim()) {
    ans.name = `${pro}项目`
  }
  let obj = ans
  uploadConfigJS[pro] = {}
  uploadConfigJS[pro][env] = obj
  fs.writeFile(uploadConfigJSON, JSON.stringify(uploadConfigJS), 'utf-8', async err => {
    if (err) {
      console.log('出错了')
      return false
    }
    bgYellowLog(`${pro} 项目  ${env} 环境`)
    await new Promise((resolve) => {
      deploy(obj)
      resolve()
    })
    await new Promise((resolve) => {
      setTimeout(() => {
        cb()
        resolve()
      }, 500)
    })
  })
}

/**
 * 指定路径文件夹打包 默认dist
 */
const deploySingle = async(proPath = 'dist') => {
  // 如果 dist 则不需要询问当前环境，dist属于最近build文件夹，使用template.json配置
  // 如果不是dist 则需要询问当前部署的环境，因为当前应该是直接上传部署文件夹 没有其他参考配置
  envQuestions[0].when = e => {
    return proPath !== 'dist'
  }
  let ans = await inquirer.prompt(envQuestions)
  const DEPLOY_ENV = ans.env || useEnv // 部署环境
  // 获取项目name
  let p = dealPath2Config(proPath).usePro
  // 当前部署配置里面是否已经存在配置
  const hasConfig = uploadConfigJS[p] && uploadConfigJS[p][DEPLOY_ENV]
  if(!hasConfig) {
    console.log('\n*******************');
    bgYellowLog(`创建配置:${p} 项目  ${DEPLOY_ENV} 环境`);
    ask(p, DEPLOY_ENV)
  } else {
    bgYellowLog(`配置打包: ${p} 项目  ${DEPLOY_ENV} 环境`);
    let useConfig = uploadConfigJS[p][DEPLOY_ENV]
    deploy(useConfig)
  }
}

// 异步多项目配置
class AsyncMultDeploy {
  constructor(fold, pros, env, cb) {
    this.fold = fold
    this.pros = pros
    this.env = env
    this.cb = cb
  }
  start() {
    if (this.pros && this.pros.length > 0) {
      let pro = `${this.pros.shift()}`
      let p = dealPath2Config(`${this.fold}/${pro}`).usePro
      const hasConfig = uploadConfigJS[p] && uploadConfigJS[p][this.env]
      if (!hasConfig) {
        console.log('\n*******************');
        bgYellowLog(`创建配置: ${p} 项目  ${this.env} 环境`);
        ask(p, this.env, () => { this.start() }, (q) => {
          const c = q.map(item => {
            if (item.name === 'localPath') {
              item.default = `${this.fold}/${pro}`
            }
            return item
          })
          return c
        })
      } else {
        console.log('\n*******************');
        bgYellowLog(`配置打包: ${p} 项目  ${this.env} 环境`);
        let useConfig = uploadConfigJS[p][this.env]
        deploy(useConfig)
        this.start()
      }
    } else {
      console.log('询问结束');
    }
  }
}

// 部署文件夹下面的各个项目
const deployMult = async (foldPath = 'src/pureWeb') => {
  envQuestions[0].when = e => {
    return foldPath !== 'dist'
  }
  let ans = await inquirer.prompt(envQuestions)
  const DEPLOY_ENV = ans.env || useEnv // 部署环境
  const PRO_LIST = getDir(foldPath)
  proChoices[0].choices = PRO_LIST
  const PICK_PROS_OBJ = await inquirer.prompt(proChoices)
  const PICK_PROS = PICK_PROS_OBJ.name
  let asyncMult = new AsyncMultDeploy(foldPath, PICK_PROS, DEPLOY_ENV)
  await asyncMult.start()
}

// 打包配置表里面的选项
const deployMultFromConfig = async (keyword, type) => {
  envQuestions[0].when = e => {
    return true
  }
  let ans = await await inquirer.prompt(envQuestions)
  const DEPLOY_ENV = ans.env
  let arr = []
  // 需要过滤掉 dist 部署类型  因为这部分是不确定的
  // 且对应的环境存在配置的
  for(let i in uploadConfigJS) {
    if (uploadConfigJS[i][DEPLOY_ENV] && uploadConfigJS[i][DEPLOY_ENV].localPath !== 'dist') {
      arr.push(i)
    }
  }
  if(keyword) { // 关键词搜索
    let k = deployMatch(keyword, DEPLOY_ENV)
    if(type && type === 'or') { // 模糊匹配
      if (k.or && k.or.length) {
        proChoices[0].choices = k.or
      } else {
        errorLog(`关键词: ${keyword} 没有匹配的配置，请先新建`);
        process.exit(0)
      }
    } else { // 精确匹配
      if(k.and && k.and.length) {
        proChoices[0].choices = k.and
      } else {
        errorLog(`关键词: ${keyword} 没有匹配的配置，请先新建`);
        process.exit(0)
      }
    }
  } else { // 除了 dist 的全部配置
    proChoices[0].choices = arr
  }
  const PICK_PROS_OBJ = await inquirer.prompt(proChoices)
  const PICK_PROS = PICK_PROS_OBJ.name
  for(let i of PICK_PROS) {
    await new Promise((resolve) => {
      console.log('\n*******************');
      bgYellowLog(`配置打包:${i} 项目  ${DEPLOY_ENV} 环境`);
      deploy(uploadConfigJS[i][DEPLOY_ENV])
      resolve()
    })
  }
}

// 部署配置表里的 通过关键词定位
const deployMatch = (keyword, env) => {
  if(keyword) {
    let k = keyword.split('+')
    let sumKeyObj = {}
    k.map(item => {
      sumKeyObj[item] = []
    })
    let arrPro = []
    let arrEnv = []
    for(let i in uploadConfigJS) {
      k.map(ii => {
        if (!uploadConfigJS[i][env]) {
          errorLog(`关键词: ${keyword} \n在 ${env} 环境下没有匹配的配置`);
          process.exit(0)
        }
        let reg = new RegExp(ii)
        if (env) {
          if (uploadConfigJS[i][env] && uploadConfigJS[i][env].name.match(reg)) {
            arrEnv.push(i)
            sumKeyObj[ii].push(i)
          }
        }
        if (i.match(reg)) {
          arrPro.push(i)
          sumKeyObj[ii].push(i)
        }
      })
    }
    let getkeyall = []
    let xChild = []
    for(let i in sumKeyObj) {
      sumKeyObj[i] = [...new Set(sumKeyObj[i])]
      xChild = sumKeyObj[i]
      if(!sumKeyObj[i].length) {
        xChild = []
        break;
      }
      getkeyall.push(sumKeyObj[i])
    }
    // for 循环求交集
    // let init = []
    // let exchangeMiddle = []
    // for(let i = 0; i < getkeyall.length; i++) {
    //   if (i === 0) {
    //     init = getkeyall[i]
    //     continue;
    //   }
    //   let l = [] // 大的那个数组
    //   let r = [] // 小的那个数组
    //   if(init.length >= getkeyall[i].length) {
    //     l = init
    //     r = getkeyall[i]
    //   } else {
    //     l = getkeyall[i]
    //     r = init
    //   }
    //   r.map(item => {
    //     if (l.includes(item)) {
    //       exchangeMiddle.push(item)
    //     }
    //   })
    //   init = exchangeMiddle
    //   exchangeMiddle = []
    // }
    // reduce 方法求交集
    let andArr;
    if(xChild.length > 0) { // 若某个自己长度为 0 则直接退出
      andArr = getkeyall.reduce((pre, cur) => {
        if (pre.length > 0) {
          return pre.map(item => {
            if (cur.includes(item)) {
              return item
            }
          }).filter(item => {
            return !!item
          })
        } else {
          return [...pre, ...cur]
        }
      }, [])
    } else {
      andArr = []
    }
    return {
      and: andArr,
      or: [...new Set([...arrPro, ...arrEnv])]
    }
  }
}

module.exports = {
  deployMult,
  deploySingle,
  deployMultFromConfig,
  deployMatch
}
