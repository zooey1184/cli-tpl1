// deploy.js
const fs = require('fs');
const SSH = require('node-ssh');
const archiver = require('archiver');
const { successLog, errorLog, cyanLog } = require('../tools/log');

let ssh = new SSH(); // 生成ssh实例
let DIST = 'dist' // 打包的名称

// 获取本地需要上传的文件的名称
const getFoldName = (localPath) => {
  let foldNameArr = localPath.split('/')
  let foldname = foldNameArr[foldNameArr.length - 1]
  return foldname
}

// 获取真正的文件夹名称 用于 替换DIST名称
const getRealLocalPath = localPath => {
  let foldNameArr = localPath.split('/')
  let lastName = ''
  if (foldNameArr.length > 2) {
    let reg = new RegExp(foldNameArr[foldNameArr.length - 2] + '_')
    lastName = foldNameArr[foldNameArr.length - 1].replace(reg, '')
  } else {
    lastName = foldNameArr[foldNameArr.length - 1]
  }
  foldNameArr[foldNameArr.length - 1] = lastName
  return foldNameArr.join('/')
}

// 部署流程入口
async function deploy(config) {
  const { remotePath, localPath, name } = config;
  // 转化文件夹为相对路径
  const localPathResolve = './' + getRealLocalPath(localPath)
  DIST = getFoldName(localPathResolve)
  try {
    await startZip(localPathResolve);
    await connectSSH(config);
    await uploadFile(localPathResolve, remotePath);
    await unzipFile(remotePath);
    await deleteLocalZip(localPathResolve);
    cyanLog(`${name}`)
    cyanLog('项目部署成功了')
    // process.exit(0);
    ssh.dispose()
  } catch (err) {
    errorLog(`部署失败 ${err}`);
    process.exit(1);
  }
}

// 打包zip
function startZip(localPath) {
  return new Promise((resolve, reject) => {
    let foldname = '/' + getFoldName(localPath)
    const zipPath = localPath.replace(foldname, '')
    const archive = archiver('zip', {
      zlib: { level: 9 }
    }).on('error', err => {
      throw err;
    });

    const output = fs.createWriteStream(`${zipPath}/${DIST}.zip`);
    output.on('close', err => {
      if (err) {
        errorLog(`关闭archiver异常 ${err}`);
        reject(err);
        process.exit(1);
      }
      successLog('\n（1）zip打包成功');
      resolve();
    });
    archive.pipe(output);
    archive.directory(localPath, '/');
    archive.finalize();
  });
}

// 连接SSH
async function connectSSH(config) {
  const { host, port, username, password } = config;
  const sshConfig = { host, port, username, password };
  try {
    await ssh.connect(sshConfig);
    successLog(`（2）${username}@${host}  连接成功`)
    // ssh.dispose()
  } catch (err) {
    errorLog(`连接失败 ${err}`);
    process.exit(1);
  }
}

// 上传zip包
async function uploadFile(localPath, remotePath) {
  try {
    let foldname = getFoldName(localPath)
    const local = localPath.replace(foldname, '')
    await ssh.putFile(`${local}${DIST}.zip`, `${remotePath}/${DIST}.zip`);
    successLog(`（3）成功上传目录至：${remotePath}`)
  } catch (err) {
    errorLog(`zip包上传失败 ${err}`);
    process.exit(1);
  }
}

// 运行命令
async function runCommand(command, remotePath) {
  await ssh.execCommand(command, {
    cwd: remotePath
  });
}

// 解压zip包
async function unzipFile(remotePath) {
  try {
    await runCommand(`cd ${remotePath}`, remotePath);
    await runCommand(`unzip -o ${DIST}.zip && rm -f ${DIST}.zip`, remotePath);
    successLog('（4）远程zip包解压成功');
  } catch (err) {
    errorLog(`zip包解压失败 ${err}`);
    process.exit(1);
  }
}

// 删除本地dist.zip包
async function deleteLocalZip(localPath) {
  return new Promise((resolve, reject) => {
    let foldname = getFoldName(localPath)
    fs.unlink(`${localPath.replace(`${foldname}`, '')}${DIST}.zip`, err => {
      if (err) {
        errorLog(`本地zip包删除失败 ${err}`, err);
        reject(err);
        process.exit(1);
      }
      successLog(`（5）本地${DIST}.zip删除成功\n`);
      resolve();
    });
  });
}

module.exports = deploy
