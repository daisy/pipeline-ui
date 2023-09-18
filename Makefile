include engine/make/enable-java-shell.mk

.PHONY : default
ifeq ($(OS), WINDOWS)
default : exe
else ifeq ($(OS), MACOSX)
default : dmg
endif

ENGINE_VERSION := $(shell println(xpath(new File("engine/pom.xml"), "/*/*[local-name()='version']/text()"));)

.PHONY : dmg
dmg : src/resources/daisy-pipeline src/resources/icons/logo_mac_40x40_Template@2x.png
	exec("yarn");
	exec("yarn", "dist-mac-dev", "--mac");

.PHONY : exe
exe : src/resources/daisy-pipeline
	exec("yarn.cmd");
	exec("yarn.cmd", "dist", "--win");

ifeq ($(OS), WINDOWS)
zip_classifier := win
else ifeq ($(OS), MACOSX)
zip_classifier := mac
endif

src/resources/daisy-pipeline : engine/target/assembly-$(ENGINE_VERSION)-$(zip_classifier).zip
	rm("$@");
	unzip(new File("$<"), new File("$(dir $@)"));
ifeq ($(OS), MACOSX)
	// FIXME: unzip() currently does not preserve file permissions \
	exec("chmod", "+x", "$@/jre/bin/java");
endif

engine/target/assembly-$(ENGINE_VERSION)-$(zip_classifier).zip : \
		engine/pom.xml \
		$(shell Files.walk(Paths.get("engine/src")).filter(Files::isRegularFile).forEach(System.out::println);)
	exec("$(MAKE)", "-C", "engine", "zip-$(zip_classifier)",         \
	                                "--", "--without-osgi",          \
			                        "--without-cli",                 \
			                        "--without-updater",             \
			                        "--without-persistence");

clean :
	exec("yarn", "clean");
	rm("src/resources/daisy-pipeline");
	rm("node_modules/.dev-temp-build");
	exec("$(MAKE)", "-C", "engine", "clean");


