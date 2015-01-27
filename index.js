var pkginfo = require('pkginfo')(module);
var config = require("config");
var fs = require("fs");
var colors = require("colors");
var util = require('util');
var async = require('async');
var path = require('path');

var actions = require("./actions");

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

var torrentPath = config.get("paths.in.torrents");

// Browse through input torrent directory
var inDirContent = fs.readdirSync(torrentPath);
var torrentFiles = [],
    file,
    stat;

// Filter out non-torrent files
for(var i = 0; i < inDirContent.length; i++) {
  file = inDirContent[i];
  stat = fs.statSync(path.join(torrentPath, file));
  if (stat.isFile() && /.*\.torrent/.test(file)) {
    torrentFiles.push(file);
  }
}

console.log(util.format("\n%s torrent file(s) found out of %d", torrentFiles.length, inDirContent.length));

// For each file, execute a serie of action.
for(var i = 0; i < torrentFiles.length; i++) {
  // Declares context, actions will amend it.
  var context = {
    website: {
      url: config.get("website.url"),
      user: config.get("website.user"),
      password: config.get("website.password")
    },
    paths: {
      in: {
        torrent: config.get("paths.in.torrents"),
        data: config.get("paths.in.data")
      },
      out: {
        torrent: config.get("paths.out.torrents"),
        data: config.get("paths.out.data")
      }
    },
    torrent: {
      path: path.join(torrentPath, torrentFiles[i]),
      filename: torrentFiles[i],
    },
    log: []
  };

  async.waterfall([
      // First function only takes one parameter.
      // With this, all actions have the same interface.
      function (callback) { callback(null, null); },
      actions.parseTorrent.bind(context),
      actions.verifyFilePresence.bind(context),
      actions.fetchFromTracker.bind(context),
    ],
    (function (err, result) {
      var out = err ? console.error : console.log;

      out(util.format("\nProcessing %s", this.torrent.filename.bold.cyan));
      for (var i = 0; i < this.log.length; i++) {
        out("… " + this.log[i]);
      }

      if (err) {
        out(err);
      }
      else {
        out(result || "Done".bold.green);
      }
    }).bind(context)
    );

}
