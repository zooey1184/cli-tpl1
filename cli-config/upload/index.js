const tplObj = require(`${__dirname}/../template`)
const inquirer = require('inquirer')
const fs = require('fs')
const uploadConfig = `${__dirname}/template.json`
const tplConfig = require(`./template`)
const useDir = process.env.dir || 'pages'
const usePro = useDir === 'pages' ? tplObj.usePro : `${useDir}_${tplObj.usePro}`
const useEnv = tplObj[tplObj.usePro].useEnv
const deploy = require('./deploy')
const country = 'vietnam'
const sshObj = require('./sshConfig')
const { bgYellowLog, bgCyanLog } = require('../tools/log')
const getDir = require('./getDir')

const choosePro = getDir('src/pureWeb')
const preQuestion = [
  {
    name: 'useLastBuild',
    type: 'confirm',
    message: '是否使用最近一次打包 dist 文件夹部署',
    default: true
  },
  {
    name: 'env',
    type: 'list',
    message: '请选择部署环境',
    choices: ['production', 'dev'],
    default: 'production',
    when: e => {
      return !e.useLastBuild
    }
  },
  {
    name: 'name',
    type: 'checkbox',
    message: '选择部署文件',
    choices: choosePro,
    when: e => {
      return !e.useLastBuild
    },
    validate: val => {
      if(val.length < 1) {
        return '请至少选择一个项目部署'
      }
      return true
    }
  }
]

// 保存的用户名和密码用于 默认错开问题填答案
let username = ''
let password = ''
const questions = [
  {
    name: 'host',
    type: 'input',
    message: '请输入服务器地址',
    default: ''
  },
  {
    name: 'username',
    type: 'input',
    message: '请输入 ssh 用户名',
    default: '',
    when: (e) => {
      // 如果是开发服或者正式服就不需要展示了
      let b = true
      for (let i in sshObj) {
        if (sshObj[i].h === e.host) {
          username = sshObj[i].u
          password = sshObj[i].p
          b = false
        }
      }
      return b
    }
  },
  {
    name: 'port',
    type: 'input',
    message: '请输入端口号',
    default: '20002'
  },
  {
    name: 'password',
    type: 'input',
    message: '请输入 ssh 密码',
    default: '',
    validate: (val) => {
      if (val.length < 1) {
        return '请输入 ssh 密码'
      }
      return true
    },
    when: (e) => {
      // 如果是开发服或者正式服就不需要展示了
      let b = true
      for (let i in sshObj) {
        if (sshObj[i].h === e.host) {
          b = false
        }
      }
      return b
    }
  },
  {
    name: 'remotePath',
    type: 'input',
    message: '请输入部署路径',
    default: '',
    validate: (val) => {
      if (val.length < 1) {
        return '请输入部署路径'
      }
      return true
    }
  },
  {
    name: 'localPath',
    type: 'input',
    message: '需要部署的文件夹路径',
    default: 'dist'
  },
  {
    name: 'name',
    type: 'input',
    message: '备注说明',
    default: ''
  }
]

// 本地 dist 打包部署情况
const deployDistFold = () => {
  if (!(tplConfig[usePro] && tplConfig[usePro][useEnv])) {
    inquirer.prompt(questions).then(ans => {
      if (!ans.username) {
        ans.username = username
      }
      if (!ans.password) {
        ans.password = password
      }
      if (!ans.name.trim()) {
        ans.name = `${country}工程  ${usePro}项目`
      }

      let obj = ans
      tplConfig[usePro] = {}
      tplConfig[usePro][useEnv] = obj
      fs.writeFile(uploadConfig, JSON.stringify(tplConfig), 'utf-8', err => {
        if (err) {
          console.log('出错了')
          return false
        }
        bgYellowLog(`${useEnv} 环境`)
        deploy(obj)
      })
    })
  } else {
    let dconfig = tplConfig[usePro][useEnv]
    bgYellowLog(`${useEnv} 环境`)
    deploy(dconfig)
  }
}

// async 部署多项目
class AsyncMultDeploy {
  constructor(projects, ans, cb) {
    this.index = 0
    this.ans = ans
    this.projects = projects
    this.cb = cb
  }
  start() {
    if(this.projects.length > 0) {
      let p = `pureWeb_${this.projects.pop()}`
      if (!(tplConfig[p] && tplConfig[p][this.ans.env])) {
        bgCyanLog(`\n开始 ${p} 配置`);
        inquirer.prompt(questions).then(ans => {
          if (!ans.username) {
            ans.username = username
          }
          if (!ans.password) {
            ans.password = password
          }
          if(!ans.name.trim()) {
            ans.name = `${country}工程  ${p}项目`
          }
          let obj = ans
          // 如果是dist 则默认修改到对应的文件夹下面
          obj.localPath = obj.localPath === 'dist' ? `src/pureWeb/${p}` : obj.localPath
          tplConfig[p] = {}
          tplConfig[p][this.ans.env] = obj
          fs.writeFile(uploadConfig, JSON.stringify(tplConfig), 'utf-8', async(err) => {
            if (err) {
              console.log('出错了')
              return false
            }
            console.log('\n_____________________________');
            bgYellowLog(`${this.ans.env} 环境`)
            await deploy(obj)
            await this.start()
          })
        })
      } else {
        const curr = async () => {
          let dconfig = tplConfig[p][this.ans.env]
          console.log('\n_____________________________');
          bgYellowLog(`${this.ans.env} 环境`)
          await deploy(dconfig)
          await this.start()
        }
        curr()
      }
    } else {
      if(this.cb && typeof this.cb === 'function') {
        this.cb()
      }
    }
  }
}

inquirer.prompt(preQuestion).then(res => {
  if(res.useLastBuild) {
    deployDistFold()
  } else {
    let pros = res.name
    let mult = new AsyncMultDeploy(pros, res)
    mult.start()
  }
})
