REM --formatting PRETTY_PRINT
java -jar ..\closure_compiler\compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS ^
--js_output_file cf.js ^
--externs "./js/Stratiscape-prod.js" ^
--externs "./js/audio-interface.js" ^
--js "./chemfight/Globals.js" ^
--js "./chemfight/Util.js" ^
--js "./chemfight/Model.js" ^
--js "./chemfight/View.js" ^
--js "./chemfight/Controller.js" ^
--js "./chemfight/Player.js" 2> output-debug.txt
