#Linter-CNew
Linter-CNew is an nearly-complete rewrite of [hebaishi/linter-gcc](https://github.com/hebaishi/linter-gcc). It was originally created to fix an issue in linter-gcc that caused failures with more than one project open at a time.
##Compared to the original
###Features Missing/Incomplete
* CMake support is implemented, but untested
* Lint-on-the-fly support is unimplemented
###Features Added
* Per-project/per-file configuration is handled as expected
* Configuration is recursively built up starting recursively as follows:
  1. /proj/subdir/file.ext.gcc-flags.json
  2. /proj/subdir/.gcc-flags.json
  3. /proj/.gcc-flags.json
  4. Configuration values stored in Atom
  5. Bundled defaults
  This behavior should be compatible with projects currently using linter-gcc
##Issues
Feel free to file issues on the project after you have made sure that the issue is actually being caused by linter-cnew and not something like not having gcc installed. Pull requests are welcome as well, so long as you don't deviate in coding style from the project (suggestions for changes to this are welcome, too) and don't drag in a bunch of unnecessary dependencies. (Atom/Node provides a lot of stuff by default: use it.)
