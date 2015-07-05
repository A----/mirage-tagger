var flacMetadata = require("flac-metadata");
var util = require("util");
var fs = require("fs");
var path = require("path");
var fsTools = require("fs-tools");
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

  if(imageUrl) {
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

    if(pkg) {
      pkg.get(imageUrl, (function(res) {
        if(res.statusCode != 200) {
          callback("Invalid " + "status code".red + ": " + res.statusCode);
        }
        else {
          var contentType = res.headers['content-type'];
          if(contentType && extentions[contentType]) {
            var outFilename = path.join(this.paths.out.data, "wcd_cover" + extentions[contentType]);

            dirname = path.dirname(outFilename);
            if(!fs.existsSync(dirname)) {
              fsTools.mkdirSync(dirname);
              this.log.push("Creating directory " + dirname.green);
            }

            var outFile = fs.createWriteStream(outFilename);
            outFile.on('finish', function() {
              outFile.close(callback);
            });
            res.pipe(outFile);
          }
          else {
            callback("Unhandled " + "MIME type".red + ": " + contentType);
          }
        }
      }).bind(this)).on('error', (function(e) {
        this.log.push("An " + "error occurred".red + " while downloading the cover");
        callback(e, null);
      }).bind(this));
    }
    else {
      callback("Unsupported " + "scheme".red);
    }
  }

};
