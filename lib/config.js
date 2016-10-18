'use strict';

const path = require('path');
const fs = require('fs');
const defaultConfig = require("./defaultConfig");
const SETTINGS_FILENAME = ".gcc-flags.json";
const CONFIG_KEYS = {"execPath": "string",
                      "gccDefaultCFlags": "string",
                      "gccDefaultCppFlags": "string",
                      "gccErrorLimit": "number",
                      "gccIncludePaths": "string",
                      "gccSuppressWarnings": "boolean"
                    };
module.exports.niceName = 'Custom file (.gcc-flags.json)';
/*this is just a wrapper around JSON.parse to prevent its
exception from bubbling up*/
function attemptToParse(fileContents) {
  let contents = undefined;
  try {
    contents = JSON.parse(fileContents);
  }
  catch (e) {
    return;
  }
  return contents;
}
/*parses the data from the given object into proper types*/
function parseKey(fileContents, key) {
  /*if the key isn't defined, give up now*/
  if (!fileContents[key]) {
    return;
  }
  if (atom.config.get("linter-gcc.gccDebug")) {
    console.log("LinterGCC: parsing config key "+key+" ("+fileContents[key]+")");
  }
  let keyType = CONFIG_KEYS[key];
  if (typeof(fileContents[key]) == keyType) {
    return fileContents[key];
  }
  if (atom.config.get("linter-gcc.gccDebug")) {
    console.log("LinterGCC: type mismatch for "+key+" "+typeof(fileContents[key])+" vs "+CONFIG_KEYS[key]);
  }
}
/*Adds missing config keys with new values from parsed object*/
function spliceConf(fileContents, confObj) {
  /*balk if contents isn't an object*/
  if (typeof(fileContents) != "object") {
    console.log("spliceConf balking");
    return;
  }
  for (var key in fileContents) {
    /*if the key isn't already in confObj, add it*/
    if (confObj[key] == undefined) {
      confObj[key] = parseKey(fileContents, key);
      console.log(confObj[key]);
    }
  }
}
/*Checks to make sure all given config keys are filled in*/
function checkConf(confObj) {
  for (var key in CONFIG_KEYS) {
    if (confObj[key] == undefined) {
      if (atom.config.get("linter-gcc.gccDebug")) {
        console.log("LinterGCC: Missing key: "+key);
      }
      return false;
    }
  }
  return true;
}
/*adds in missing keys from Atom config or from bundled file*/
function addDefaultConf(confObj) {
  for (var key in CONFIG_KEYS) {
    if (!confObj[key]) {
      if (atom.config.get("linter-gcc.gccDebug")) {
        console.log("LinterGCC: Adding default value for: "+key);
      }
      if (atom.config.get("linter-gcc."+key)) {
        confObj[key] = atom.config.get("linter-gcc."+key);
      }
      else {
        confObj[key] = defaultConfig[key];
      }
    }
  }
}
function readConfFile(fileName, confObj) {
  if (fs.existsSync(fileName)) {
    let contents = attemptToParse(fs.readFileSync(fileName));
    if (atom.config.get("linter-gcc.gccDebug")) {
      console.log("LinterGCC: Reading: "+fileName);
    }
    confObj = spliceConf(contents, confObj);
  }
}
function findConf(fileName, projectDir, confObj = {}) {
  readConfFile(fileName+SETTINGS_FILENAME, confObj);
  readConfFile(path.join(fileName, SETTINGS_FILENAME), confObj);
  if (checkConf(confObj)) {
    return confObj;
  }
  else {
    if (fileName == projectDir || projectDir == undefined) {
      addDefaultConf(confObj);
      return confObj;
    }
    else {
      return findConf(path.join(fileName, ".."), projectDir, confObj);
    }
  }
}
module.exports.settings = function (fileName, projectDir) {
  return findConf(fileName, projectDir);
}
