include engine/.make/enable-java-shell.mk

.PHONY : default
ifeq ($(OS), WINDOWS)
default : exe
else ifeq ($(OS), MACOSX)
default : dmg
endif

ENGINE_VERSION := $(shell println(xpath(new File("engine/assembly/pom.xml"), "/*/*[local-name()='version']/text()"));)

.PHONY : dmg
dmg : src/resources/daisy-pipeline src/resources/icons/logo_mac_40x40_Template@2x.png
	exec("yarn");
	exec("yarn", "dist", "--mac");

.PHONY : exe
exe : src/resources/daisy-pipeline
	exec("yarn.cmd");
	exec("yarn.cmd", "dist", "--win");

.PHONY : release
release: src/resources/daisy-pipeline
ifeq ($(OS), WINDOWS)
	exec("yarn.cmd");
	exec("yarn.cmd", "release");
else
	exec("yarn");
	exec("yarn", "release");
endif

ifeq ($(OS), WINDOWS)
zip_classifier := win
else ifeq ($(OS), MACOSX)
zip_classifier := mac
endif

src/resources/daisy-pipeline : engine/assembly/target/assembly-$(ENGINE_VERSION)-$(zip_classifier).zip
	rm("$@");
	unzip(new File("$<"), new File("$(dir $@)"));
	rm("$@/cli/config.yml");
ifeq ($(OS), WINDOWS)
	cp("bin/modules/prebuild/config_windows.yml", "$@/cli/config.yml");
else
	cp("bin/modules/prebuild/config_macos.yml", "$@/cli/config.yml");
endif
ifeq ($(OS), MACOSX)
	// FIXME: unzip() currently does not preserve file permissions \
	exec("chmod", "+x", "$@/jre/bin/java");
	exec("chmod", "+x", "$@/jre/lib/jspawnhelper");
endif

engine/assembly/target/assembly-$(ENGINE_VERSION)-$(zip_classifier).zip :
	exec("$(MAKE)", "-C", "engine", "dist-zip-$(zip_classifier)");

clean :
ifeq ($(OS), WINDOWS)
	exec("yarn.cmd", "clean");
else
	exec("yarn", "clean");
endif
	rm("src/resources/daisy-pipeline");
	rm("node_modules/.dev-temp-build");
	exec("$(MAKE)", "-C", "assembly/engine", "clean");
