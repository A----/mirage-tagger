var flacMetadata = require("flac-metadata");
var util = require("util");
var fs = require("fs");
var path = require("path");
var fsTools = require("fs-tools");
var async = require("async");
var https = require("https");
var http = require("http");

var extentions = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/bmp": ".bmp",
  "image/gif": ".gif"
}

module.exports = function (noop, callback) {
  var imageUrl = this.metadata.group.wikiImage;

  if(!imageUrl) {
    this.log.push("No cover ".red + "specified");
    callback();
  }
  else {
    var pkg = null;

    this.log.push("Downloading cover " + imageUrl.cyan);

    switch(imageUrl.substring(0, 5)) {
    case "https":
      pkg = https;
      break;
    case "http:":
      pkg = http;
      break;
    }

    var files = this.torrent.data.files,
        directories = [],
        file,
        directory,
        found;
    for(var i = 0; i < files.length; i++) {
      file = files[i];
      if (/\.flac$/.test(file.name)) {
        directory = path.dirname(path.join(this.paths.out.data, file.path));
        found = false;
        for(var j = 0; j < directories.length; j++) {
          if(directories[j] == directory) {
            found = true;
            break;
          }
        }

        if(!found) {
          directories.push(directory);
        }
      }
    }

    if(directories.length > 0 || pkg) {

      pkg.get(imageUrl, (function(res) {
        if(res.statusCode != 200) {
          this.log.push("Invalid " + "status code".red + ": " + res.statusCode);
          callback();
        }
        else {
          var contentType = res.headers['content-type'];
          if(contentType && extentions[contentType]) {
            var firstDirectory = directories.shift(),
                basename = "wcd_cover" + extentions[contentType],
                outFilename = path.join(firstDirectory, basename);

            var outFile = fs.createWriteStream(outFilename);
            outFile.on('finish', function() {
              outFile.close(function(err) {
                if(err) {
                  callback(err);
                }
                else if(directories.length == 0) {
                  callback();
                }
                else {
                  async.each(
                    directories,
                    function(directory, callback) {
                      fsTools.copy(outFilename, path.join(directory, basename), callback);
                    },
                    callback);
                }
              });
            });
            res.pipe(outFile);
          }
          else {
            this.log.push("Unhandled " + "MIME type".red + ": " + contentType);
            callback();
          }
        }
      }).bind(this))
      .on('error', (function(e) {
        this.log.push("An " + "error occurred".red + " while downloading the cover");
        this.log.push(util.inspect(e));
        callback();
      }).bind(this));
    }
    else if(directories.length > 0) {
      this.log.push("No directories ".red + "found");
      callback();
    }
    else {
      this.log.push("Unsupported " + "scheme".red);
      callback();
    }
  }

};
