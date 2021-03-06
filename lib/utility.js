"use babel";
const config = require("./config");
let globalSettings = {};
const shelljs = require("shelljs");
const path = require('path');
const fs = require('fs');
module.exports = {
  /*@pre: none
    @params: editor is the current TextEditor instance
    @post: global settings is defined*/
  init: function(openFile) {
    if (!globalSettings[openFile]) {
      if (atom.config.get("linter-cnew.gccDebug")) {
        console.log("Loading settings for "+openFile);
      }
      globalSettings[openFile] = config.settings(openFile, this.getProjectBaseDir(openFile));
    }
  },
  /*@pre: A TextEditor must be the active pane
    @returns: a TextEditor, or undefined if one is not active*/
  getOpenEditor: function() {
    return atom.workspace.getActiveTextEditor();
  },
  /*@pre: editor must be in focus
    @args: a TextEditor object
    @returns: A Atom File object representing the current file*/
  getOpenFile: function (editor) {
    return editor.getBuffer().file;
  },
  /*@pre: A TextEditor inside of a project must open
    @returns: A Atom Directory object*/
  getProjectBaseDir: function(openFile) {
    if (typeof(openFile) != "string") {
      openFile = this.getOpenFile(openFile).getPath();
    }
    /*Returns an array of [projectpath, relativePath]*/
    let projectDir = atom.project.relativizePath(openFile)[0];
    if (projectDir == null) {
      projectDir = undefined;
    }
    return projectDir;
  },
  buildCommand: function(activeEditor, file) {
    this.init(file);
    if (atom.config.get("linter-cnew.gccDebug")) {
      console.log("linter-cnew config: " + JSON.stringify(globalSettings[file]));
    }
    let command = this.getCommandFromCMake(file, activeEditor, globalSettings[file]);
    if (!command) {
      /*buildCommandFromSettings returns a complete object*/
      return this.buildCommandFromSettings(file, activeEditor, globalSettings[file]);
    }
    /*Split the binary name from before the first space and
      the args from behind it*/
    let binary = command.substring(0, command.indexOf(" "));
    let args = command.substring(command.indexOf(" ")+1, command.length);
    args = this.fixFlags(args);
    return {binary: this.findBinary(binary), args: args};
  },
  /*@pre: settings.compileCommandsFile should exist and not be whitespace
    @returns: a command object on success, otherwise undefined*/
  getCommandFromCMake: function (fileName, editor, settings) {
    /*if the variable is undefined, give up*/
    if (!settings.compileCommandsFile) {
      return;
    }
    /*if the variable is just whitespace, give up*/
    if (settings.compileCommandsFile.trim() == "") {
      return;
    }
    /*remove excess whitespace from filename*/
    let CMakeFile = settings.compileCommandsFile.trim();
    /*expand path relative to current projectDir*/
    if (CMakeFile.charAt(0) === ".") {
      let projectDir = this.getProjectBaseDir(editor);
      CMakeFile = path.join(projectDir, CMakeFile);
    }
    if (atom.config.get("linter-cnew.debug")) {
      console.log("LinterCNew: attempting to read CMake file: "+CMakeFile);
    }
    try {
      /*One of two things can throw in the next line:
        1. The file doesn't exist/isn't readable
        2. The file isn't JSON/won't parse
        Either one of those is reason to give up now*/
      let CMakeFileContents = JSON.parse(fs.readFileSync(CMakeFile));
    }
    catch (e) {
      return;
    }
    for (entry in CMakeFileContents) {
      if (CMakeFileContents[entry].file === fileName) {
        let command = CMakeFileContents[entry].command;
        break;
      }
    }
    return command;
  },
  buildCommandFromSettings: function (fileName, editor, settings) {
    let projectDir = this.getProjectBaseDir(editor);
    let flags = "";
    if (atom.config.get("linter-cnew.gccDebug")) {
      console.log("LinterCNew: gccDefaultCFlags: "+settings.gccDefaultCFlags);
      console.log("LinterCNew: gccDefaultCppFlags: "+settings.gccDefaultCppFlags);
    }
    if (this.isCPP(editor)) {
      flags = this.fixFlags(settings.gccDefaultCppFlags);
    }
    else {
      flags = this.fixFlags(settings.gccDefaultCFlags);
    }
    let includes = this.processIncludes(settings.gccIncludePaths, projectDir);
    let binary = this.findBinary(settings.execPath);
    if (settings.gccErrorLimit > 0) {
      flags += ` -fmax-errors=${settings.gccErrorLimit}`;
    }
    if (settings.gccSuppressWarnings) {
      flags += " -w";
    }
    /*Avoid giving gcc an empty arg, which it will try to interpret
    as a file, which will always fail*/
    if (includes.length == 0) {
      return {binary: binary, args: flags.split(" ").concat([fileName])};
    }
    return {binary: binary, args: flags.split(" ").concat([includes, fileName])};
  },
  fixFlags: function (command) {
    let explodedCommand = command.split(" ");
    let outputFlagIndex = explodedCommand.indexOf("-o");
    if (outputFlagIndex === -1) {
      return command+" -c -o /dev/null";
    }
    /*Select a subarray from the beginning to just before the -o flag*/
    let argsBeforeFlag = explodedCommand.slice(0, outputFlagIndex);
    /*Select a subarray from the arg after the output file to the end*/
    let argsAfterFile = explodedCommand.slice(outputFlagIndex+2, explodedCommand.length);
    /*Inject our own flags to prevent linking and spewing object files everywhere*/
    argsAfterFile.push("-c -o /dev/null");
    /*Stick the two subarrays back together and then convert back to string*/
    return argsBeforeFlag.concat(argsAfterFile).join(" ");
  },
  findBinary: function(binaryName) {
    let binary = shelljs.which(binaryName);
    if (!binary) {
      atom.notifications.addError(
        "linter-cnew: Executable not found",
        {
          detail: "\"" + settings.execPath + "\" not found"
        }
      );
    }
    return binary;
  },
  processIncludes: function (includes, projectDir) {
    var explodedIncludes = includes.split(",");
    var processedIncludes = "";
    for (var include in explodedIncludes) {
      if (explodedIncludes[include].charAt(0) == ".") {
        processedIncludes += "-I" + path.resolve(projectDir, explodedIncludes[include]);
      }
    }
    return processedIncludes;
  },
  isCPP: function (editor) {
    if (editor.getGrammar().name.indexOf("C++") != -1) {
      return true;
    }
    return false;
  }
}
