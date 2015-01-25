var pkginfo = require('pkginfo')(module);
var config = require("config");
var fs = require("fs");
var colors = require("colors");

// Checking config.
console.log(module.exports.name.bold + " " + module.exports.version.bold);

console.log("\nWebsite: " + config.get("website.url").cyan + "\n");

var checkIsDir = function(label, configEntry) {
  var path = config.get(configEntry);
  var message = label + ": ";
  var ret;

  if (!fs.existsSync(path)) {
    message += path.red + " does not " + "exists.".red;
    ret = false;
  }
  else if (!fs.statSync(path).isDirectory()) {
    message += path.red + " is not " + "a directory.".red;
    ret = false;
  }
  else {
    message += path.cyan;
    ret = true;
  }

  console.log(message);
  return ret;
};

var isConfigValid = true;
isConfigValid &= checkIsDir("Torrents input directory", "paths.in.torrents");
isConfigValid &= checkIsDir("Torrents output directory", "paths.out.torrents");
isConfigValid &= checkIsDir("Data input directory", "paths.in.data");
isConfigValid &= checkIsDir("Data output directory", "paths.out.data");

if (!isConfigValid) {
  console.log("\nInvalid config files.".bold.red  + " Check your config/ directory and start again".bold);
  process.exit(1);
}
