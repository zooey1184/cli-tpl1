const dir = process.env.dir

const config = {
  baseUrl: 'src/pages'
}
if (dir) {
  config.baseUrl = `src/${dir}`
}
module.exports = config
