"use babel";
/*import the private utility and config methods*/
const utility = require("./utility");
const defaultConfig = require("./defaultConfig");
const atomLinter = require("atom-linter");
const atomPackageDeps = require("atom-package-deps");
/*Private methods*/
function lint(editor, fileName) {
  let command = utility.buildCommand(editor, fileName);
  if (atom.config.get("linter-cnew.gccDebug")) {
    console.log("linterCNew: Executing: "+command.binary+" "+JSON.stringify(command.args));
  }
  return atomLinter.exec(command.binary, command.args, {stream: "stderr", allowEmptyStderr: true}).then(function (output) {
    let regex = `(?<file>.+):(?<line>\\d+):(?<col>\\d+):\\s*\\w*\\s*(?<type>(${atom.config.get('linter-cnew.gccErrorString')}|${atom.config.get('linter-cnew.gccWarningString')}|${atom.config.get('linter-cnew.gccNoteString')})):\\s*(?<message>.*)`;
    let msgs = atomLinter.parse(output, regex);
    /*Some other error (such as preprocessor error) occured*/
    if (msgs.length == 0 && output.indexOf("error") != -1) {
      msgs = [{
        type: "error",
        text: output,
        filePath: fileName
      }];
    }
    /*Provide optional debug output*/
    if (atom.config.get("linter-cnew.gccDebug")) {
      console.log("linterCNew messages["+msgs.length+"] from "+fileName+": ");
      for (var message in msgs) {
        console.log(" "+JSON.stringify(msgs[message]));
      }
    }
    return msgs;
  });
}
/*Public Methods*/
module.exports = {
  config: defaultConfig.atomConfig,
  activate: function() {
    if (atom.config.get("linter-cnew.gccDebug")) {
      console.log("linterCNew: activated");
    }
    if(!atom.packages.getLoadedPackages("linter")) {
      atom.notifications.addError(
        "Linter package not found.",
        {
          detail: "Please install the `linter` package in your Settings view."
        }
      );
    }
    require("atom-package-deps").install("linter-cnew");
  },
  deactivate: function() {
  },
  provideLinter: function() {
    if (atom.config.get("linter-cnew.gccDebug")) {
      console.log("linterCNew: linter installed");
    }
    return {
      name: 'linterCNew',
      scope: 'file',
      lintsOnChange: false,
      grammarScopes: ['source.c', 'source.cc', 'source.cpp', 'source.h', 'source.hh', 'source.hpp'],
      lint: function (textEditor) {
        if (atom.config.get("linter-cnew.gccDebug")) {
          console.log("linterCNew: Linting!");
        }
        return new Promise(function(resolve) {
          let fileName = utility.getOpenFile(textEditor).getPath();
          let msgs = lint(textEditor, fileName);
          resolve(msgs);
        })
      }
    }
  }
}
