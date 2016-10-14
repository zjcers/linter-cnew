module.exports = {
  atomConfig: {
    execPath: {
      title: "GCC Executable Path",
      description: "Note for Windows/Mac OS X users: please ensure that GCC is in your ```$PATH``` otherwise the linter might not work. If your path contains spaces, it needs to be enclosed in double quotes.",
      type: "string",
      default: "/usr/bin/g++",
      order : 1
    },
    gccDefaultCFlags: {
      title: "C Flags",
      description: "Supports the use of escaped characters",
      type: "string",
      default: "-c -Wall",
      order : 2
    },
    gccDefaultCppFlags: {
      title: "C++ Flags",
      description: "Supports the use of escaped characters",
      type: "string",
      default: "-c -Wall -std=c++11",
      order : 3
    },
    gccIncludePaths: {
      title: "GCC Include Paths",
      description: "Enter your include paths as a comma-separated list. Paths starting with ```.``` or ```..``` are expanded relative to the project root path and paths starting with a ```-``` are expanded relative to the path of the active file. If any of your paths contain spaces, they need to be enclosed in double quotes. To expand a directory recursively, add ```/*``` to the end of the path",
      type: "string",
      default: " ",
      order : 4
    },
    gccErrorLimit: {
      title: "GCC Error Limit",
      description: "To completely remove `-fmax-errors`, simply enter `-1` here.",
      type: "integer",
      default: 0,
      order : 5
    },
    gccSuppressWarnings: {
      title: "Suppress GCC Warnings",
      type: "boolean",
      default: false,
      order : 6
    },
    gccErrorString: {
        title: "String GCC prepends to errors",
        type: "string",
        default: "error",
        order: 7
    },
    gccWarningString: {
        title: "String GCC prepends to warnings",
        type: "string",
        default: "warning",
        order: 8
    },
    gccNoteString: {
        title: "String GCC prepends to notes",
        type: "string",
        default: "note",
        order: 9
    },
    gccLintOnTheFly: {
      title: "Lint on-the-fly",
      description: "Please ensure any auto-saving packages are disabled before using this feature",
      type: "boolean",
      default: false,
      order : 10
    },
    gccLintOnTheFlyInterval: {
      title: "Lint on-the-fly Interval",
      description: "Time interval (in ms) between linting",
      type: "integer",
      default: 300,
      order : 11
    },
    gccDebug: {
      title: "Show Debugging Messages",
      description: "Please read the linter-gcc wiki [here](https://github.com/hebaishi/linter-gcc/wiki) before reporting any issues.",
      type: "boolean",
      default: false,
      order : 12
    },
    compileCommandsFile: {
      title: "Compile commands file",
      description: "Path to cmake compile_commands.json",
      type: "string",
      default: "./build/compile_commands.json",
      order : 12
    }
  },
  regex: `(?<file>.+):(?<line>\\d+):(?<col>\\d+):\\s*\\w*\\s*(?<type>(${atom.config.get('linter-gcc.gccErrorString')}|${atom.config.get('linter-gcc.gccWarningString')}|${atom.config.get('linter-gcc.gccNoteString')})):\\s*(?<message>.*)`
}
