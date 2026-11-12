@echo off
echo Compiling Gym Arena Java DSA programs...
javac *.java
if errorlevel 1 (
  echo Compilation failed.
  exit /b 1
)
echo All Java DSA programs compiled successfully.
