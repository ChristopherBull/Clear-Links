# Source files
SRC_FILES := src/manifest.json $(wildcard src/*.js) $(wildcard src/*.html) $(wildcard src/*.css) $(wildcard res/*) $(wildcard lib/*)

# Destination directory
DIST_DIR := dist

# Build
build: $(SRC_FILES)
	@mkdir -p $(DIST_DIR)
	@cp -R $^ $(DIST_DIR)
	

# Clean the build directory
clean:
	@rm -rf $(DIST_DIR)
