const fs = require("fs");
const path = require("path");
const chalk = require('chalk')



function exitBecauseInvalid(paramName, msg){
  let errorMessage = `'${paramName}' is not valid.`
  if(msg)
    errorMessage += " "+msg;
  console.error(chalk.red(errorMessage));
  process.exit(1);
}

/**
 * Resolves paths that start with a tilde to the user's home directory.
 * @param  {string} filePath '~/GitHub/Repo/file.png'
 * @return {string}          '/home/bob/GitHub/Repo/file.png'
 */
 function resolveTilde (filePath) {
  const os = require('os');
  if (!filePath || typeof(filePath) !== 'string') {
    return '';
  }

  // '~/folder/path' or '~' not '~alias/folder/path'
  if (filePath.startsWith('~/') || filePath === '~') {
    return filePath.replace('~', os.homedir());
  }

  return filePath;
}

/**
 * Ensures that the work directory exists
 * @param {String} workDir - The work directory.
 * @returns {String} The full work directory path. 
 */
function ensureWorkDir(workDir)
{
  if(!workDir)
    exitBecauseInvalid('work-dir', "The work directory needs to be provided.")
  var fullPath = path.resolve(workDir);
  if(!fs.existsSync(fullPath)){
    fs.mkdirSync(fullPath);
  }
  return fullPath;
}

/**
 * Finds all files recursively in the directory
 * @param {String} dir - The directory.
 * @returns {Array<string>} Returns an array of all files . 
 */
function getFiles (dir, files_){
  files_ = files_ || [];
  var files = fs.readdirSync(dir);
  for (var i in files){
      var name = dir + '/' + files[i];
      if (fs.statSync(name).isDirectory()){
          getFiles(name, files_);
      } else {
          files_.push(name);
      }
  }
  return files_;
}

module.exports = {
  resolveTilde,
  ensureWorkDir,
  getFiles
}

