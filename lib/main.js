'use babel'
/*import the private utility and config methods*/
const utility = require("./utility");
const defaultConfig = require("./defaultConfig");
const atomLinter = require("atom-linter");
const atomPackageDeps = require("atom-package-deps");
const CompositeDisposable = require('atom').CompositeDisposable;

module.exports = {
  config: defaultConfig.atomConfig,

  messages: {},
  linter_gcc: undefined,

  lint: function(editor, linted_file, real_file) {
    let command = utility.buildCommand(editor, linted_file);
    return atomLinter.exec(command.binary, command.args, {stream: "stderr"}).then(output => {
      let regex = `(?<file>.+):(?<line>\\d+):(?<col>\\d+):\\s*\\w*\\s*(?<type>(${atom.config.get('linter-gcc.gccErrorString')}|${atom.config.get('linter-gcc.gccWarningString')}|${atom.config.get('linter-gcc.gccNoteString')})):\\s*(?<message>.*)`;
      let msgs = atomLinter.parse(output, regex);
      /*Some other error (such as preprocessor error) occured*/
      if (msgs.length == 0 && output.indexOf("error") != -1){
        msgs = [{
          type: 'error',
          text: output,
          filePath: real_file
        }];
      }
      module.exports.messages[real_file] = msgs;
      /*Provide optional debug output*/
      if (atom.config.get("linter-gcc.gccDebug")) {
        console.log("LinterGCC messages["+msgs.length+"] from "+real_file+": ");
        for (var message in msgs) {
          console.log(" "+msgs[message]);
        }
      }
      if (typeof module.exports.linter_gcc != "undefined"){
        module.exports.linter_gcc.setMessages(JSON.parse(JSON.stringify(require("./utility").flattenHash(module.exports.messages))))
      }
      return msgs;
    });
  },

  activate: function() {
    this.subscriptions = new CompositeDisposable()
    if(!atom.packages.getLoadedPackages("linter")) {
    atom.notifications.addError(
      "Linter package not found.",
      {
        detail: "Please install the `linter` package in your Settings view."
      }
    );
    }
    require("atom-package-deps").install("linter-gcc");
    time_last_lint = new Date().getTime()
    lint_waiting = false
  },
  deactivate: function() {
    this.subscriptions.dispose()
  },
  consumeLinter: function(indieRegistry) {
    module.exports.linter_gcc = indieRegistry.register({
      name: 'GCC'
    })

    subs = this.subscriptions;
    lintOnTheFly = function() {
      editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
      if (!editor) return;
      if (atom.config.get("linter-gcc.gccLintOnTheFly") == false) return;
      if (lint_waiting) return;
      lint_waiting = true
      interval = atom.config.get("linter-gcc.gccLintOnTheFlyInterval")
      time_now = new Date().getTime()
      timeout = interval - (time_now - time_last_lint);
      setTimeout(
        function() {
          time_last_lint = new Date().getTime()
          lint_waiting = false
          grammar_type = utility.grammarType(editor.getGrammar().name)
          filename = String(module.exports.temp_file[grammar_type])
          require('fs-extra').outputFileSync(filename, editor.getText());
          module.exports.lint(editor, filename, editor.getPath());
        },
        timeout
      );
    };

    lintOnSave = function(){
      editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
      if (!editor) return;
      if (atom.config.get("linter-gcc.gccLintOnTheFly") == true) return;
      real_file = editor.getPath();
      module.exports.lint(editor, real_file, real_file);
    };

    cleanupMessages = function(){
      editor_hash = {};
      atom.workspace.getTextEditors().forEach( function(entry){
        try{
          path = entry.getPath()
        } catch(err){
        }
        editor_hash[entry.getPath()] = 1;
      });
      for (var file in module.exports.messages){
        if (!editor_hash.hasOwnProperty(file)){
          delete module.exports.messages[file]
        }
      }
      module.exports.linter_gcc.setMessages(JSON.parse(JSON.stringify(require("./utility").flattenHash(module.exports.messages))));
    };

    subs.add(module.exports.linter_gcc)

    atom.workspace.observeTextEditors(function(editor) {
      subs.add(editor.onDidSave(lintOnSave))
      subs.add(editor.onDidStopChanging(lintOnTheFly))
      subs.add(editor.onDidDestroy(cleanupMessages))
    })
  }
}
const config = require("./config");
