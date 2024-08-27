# Source files
SRC_FILES := src/manifest.json $(wildcard src/*.js) $(wildcard src/*.html) $(wildcard src/*.css) $(wildcard res/*) $(wildcard lib/*)
SRC_FOLDERS := src/ res/
SRC_FOLDERS_WIN := $(subst /,\,$(SRC_FOLDERS))

# Destination directory
DIST_DIR := dist

# Build
build: $(SRC_FILES)
ifeq ($(OS),Windows_NT)
	@echo Building for Windows
	if not exist "$(DIST_DIR)" mkdir $(DIST_DIR)
	for %%i in ($(SRC_FOLDERS_WIN)) do xcopy /S /E /I /Y %%i $(DIST_DIR)
else
	@echo Building for Linux/MacOS
	@mkdir -p $(DIST_DIR)
	@cp -R $^ $(DIST_DIR)
endif
	@echo Done building
	

# Clean the build directory
clean:
ifeq ($(OS),Windows_NT)
	if exist "$(DIST_DIR)" rmdir /Q /S $(DIST_DIR)
else
	@rm -rf $(DIST_DIR)
endif
	@echo Clean done
