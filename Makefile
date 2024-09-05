# Source files
SRC_DIRS := src/ res/
SRC_DIRS_WIN := $(subst /,\,$(SRC_DIRS))

# Destination directory
DIST_DIR := dist
DIST_DIR_CHROME := dist/chrome
DIST_DIR_FIREFOX := dist/firefox
DIST_DIR_CHROME_WIN := $(subst /,\,$(DIST_DIR_CHROME))
DIST_DIR_FIREFOX_WIN := $(subst /,\,$(DIST_DIR_FIREFOX))

# Build
build: build_chrome build_ff

# Build the chrome extension
build_chrome: $(SRC_DIRS)
ifeq ($(OS),Windows_NT)
	@echo Building Chrome extension, on Windows
	if not exist "$(DIST_DIR_CHROME_WIN)" mkdir $(DIST_DIR_CHROME_WIN)
	for %%i in ($(SRC_DIRS_WIN)) do xcopy /S /E /I /Y %%i $(DIST_DIR_CHROME_WIN)
	del $(DIST_DIR_CHROME_WIN)\manifest.firefox.json
else
	@echo Building Chrome extension, on Linux/MacOS
	@mkdir -p $(DIST_DIR_CHROME)
	rsync -av --exclude='.DS_Store' --exclude='manifest*.json' $^ $(DIST_DIR_CHROME)
	@cp src/manifest.json $(DIST_DIR_CHROME)/manifest.json
endif
	@echo Done building Chrome extension

# Build the firefox extension
build_ff: $(SRC_DIRS)
ifeq ($(OS),Windows_NT)
	@echo Building Firefox extension, for Windows
	if not exist "$(DIST_DIR_FIREFOX_WIN)" mkdir $(DIST_DIR_FIREFOX_WIN)
	for %%i in ($(SRC_DIRS_WIN)) do xcopy /S /E /I /Y %%i $(DIST_DIR_FIREFOX_WIN)
	del $(DIST_DIR_FIREFOX_WIN)\manifest.json
	rename  $(DIST_DIR_FIREFOX_WIN)\manifest.firefox.json manifest.json
else
	@echo Building Firefox extension, for Linux/MacOS
	@mkdir -p $(DIST_DIR_FIREFOX)
	rsync -av --exclude='.DS_Store' --exclude='manifest*.json' $^ $(DIST_DIR_FIREFOX)
	@cp src/manifest.firefox.json $(DIST_DIR_FIREFOX)/manifest.json
endif
	@echo Done building Firefox extension

# Clean the build directory
clean:
ifeq ($(OS),Windows_NT)
	if exist "$(DIST_DIR)" rmdir /Q /S $(DIST_DIR)
else
	@rm -rf $(DIST_DIR)
endif
	@echo Clean done
