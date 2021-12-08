const fs = require("fs");
const path = require("path");
const os = require('os');
const chalk = require('chalk');

function exitBecauseInvalid(paramName, msg){
  let errorMessage = `'${paramName}' is not valid.`
  if(msg)
    errorMessage += " "+msg;
  console.error(chalk.red(errorMessage));
  process.exit(1);
}

function ensureDefaultConfigFilePath(){
  const azimuthDir = '.azimuth';
  const cliConfigFile = 'cli-config.json';
  const azimuthDirPath = path.resolve(os.homedir(), azimuthDir);
  if(!fs.existsSync(azimuthDirPath)){
    fs.mkdirSync(azimuthDirPath);
  }
  const cliConfigFilePath = path.resolve(azimuthDirPath, cliConfigFile);
  if(!fs.existsSync(cliConfigFilePath)){
    let defaultCliConfig = require('../cli-config.json');
    writeFile('',cliConfigFilePath, defaultCliConfig);
  }
  return cliConfigFilePath;
}

/**
 * Resolves paths that start with a tilde to the user's home directory.
 * @param  {string} filePath '~/GitHub/Repo/file.png'
 * @return {string}          '/home/bob/GitHub/Repo/file.png'
 */
 function resolveTilde (filePath) {
  if (!filePath || typeof(filePath) !== 'string') {
    return '';
  }

  // '~/folder/path' or '~' not '~alias/folder/path'
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.resolve(os.homedir(), filePath.substr(1));
  }

  return filePath;
}

/**
 * Finds all files recursively in the directory
 * @param {String} dir - The directory.
 * @returns {Array<string>} Returns an array of all files . 
 */
function getFiles (dir, files_){
  files_ = files_ || [];
  let files = fs.readdirSync(dir);
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

/**
 * Ensures that the work directory is valid and exists
 * @param {String} workDir - The work directory.
 * @returns {String} The full work directory path. 
 */
 function ensureWorkDir(workDir)
 {
   if(!workDir)
     exitBecauseInvalid('work-dir', "The work directory needs to be provided.")
     const fullPath = path.resolve(workDir);
   if(!fs.existsSync(fullPath)){
     fs.mkdirSync(fullPath);
   }
   return fullPath;
 }
 
/**
 * Check if a file exists
 * @param {String} workDir - The work directory.
 * @param {String} fileName - The name of the file.
 * @returns {Boolean} Whether the file exists or not. 
 */
function fileExists(workDir, fileName)
{
  const filePath = path.resolve(workDir, fileName);
  return fs.existsSync(filePath);
}

/**
 * Ensures that a file exists
 * @param {String} workDir - The work directory.
 * @param {String} fileName - The name of the file.
 * @returns {String} The resolved file path if it exists. Exits the program otherwise.
 */
function ensureFileExists(workDir, fileName)
{
  const filePath = path.resolve(workDir, fileName);
  if(fs.existsSync(filePath))
  {
    return filePath;
  }
  exitBecauseInvalid('file-name', `The file ${filePath} does not exist.`);
}

/**
 * Writes the contents to a file
 * @param {String} workDir - The work directory.
 * @param {String} fileName - The name of the file.
 * @param {(String|Array|Object)} contents - The contents to write. Strings are written directly, objects as JSON, arrays with each item on a new line.
 * @returns {String} The resolved file path. Will exit print error and exit if file cannot be written.
 */
function writeFile(workDir, fileName, contents)
{
  const filePath = path.resolve(workDir, fileName);

  let toWrite = contents;
  if(Array.isArray(contents)){
    toWrite = contents.join(os.EOL);
  }
  else if(typeof contents === 'object'){
    toWrite = JSON.stringify(contents, null, 2)
  }

  try {
    fs.writeFileSync(filePath, toWrite)
  } catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
  return filePath;
}

/**
 * Reads the lines of a file into an array.
 * @param {String} workDir - The work directory.
 * @param {String} fileName - The name of the file.
 * @returns {Array} An array containing the lines.
 */
function readLines(workDir, fileName)
{
  const filePath = resolveTilde(path.resolve(workDir, fileName));
  try {
    const contents = fs.readFileSync(filePath).toString();
    const array = contents.split(os.EOL);
    return array;
  }
  catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
}

/**
 * Reads a JSON file into an object.
 * @param {String} workDir - The work directory.
 * @param {String} fileName - The name of the file.
 * @returns {Object} The parsed JSON object.
 */
function readJsonObject(workDir, fileName)
{
  const filePath = resolveTilde(path.resolve(workDir, fileName));
  try {
    const contents = fs.readFileSync(filePath).toString();
    const json = JSON.parse(contents);
    return json;
  }
  catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
}

module.exports = {
  ensureDefaultConfigFilePath,
  resolveTilde,
  ensureWorkDir,
  getFiles,
  fileExists,
  ensureFileExists,
  writeFile,
  readLines,
  readJsonObject
}

