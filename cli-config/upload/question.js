
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
    default: ''
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

const envQuestions = [
  {
    name: 'env',
    type: 'list',
    message: '请选择部署环境',
    choices: ['production', 'dev'],
    default: 'production'
  }
]

const proChoices = [
  {
    name: 'name',
    type: 'checkbox',
    message: '选择部署文件',
    choices: [],
    validate: val => {
      if (val.length < 1) {
        return '请至少选择一个项目部署'
      }
      return true
    }
  }
]

const setQuestion = (name, cb) => {
  let q = questions
  for(let i of q) {
    if(i.name === name) {
      cb(i)
    }
  }
  return q
}
module.exports = {
  setQuestion,
  envQuestions,
  proChoices,
  questions
}
