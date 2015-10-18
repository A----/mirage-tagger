var path = require("path");
var fs = require("fs");
var util = require("util");
var async = require("async");

module.exports = function (noop, callback) {
  var files = this.torrent.data.files;

  var allGood = true;

  async.filter(
    files,
    (function (item, callback) {
      var values = [
            item.path,
            item.path
              .replace(/\\[ ]+/g, '\\')               // Trumpable, a path shouldn't start with a space
              .replace(/[ ]+\\/g, '\\')               // Trailing spaces are also a no-no on windows
              .replace(/[\x00-\x1f?*:";‌​|/<>]+/g, ""), // Illegal characters on windows
            item.path
              .replace(/\\[ ]+/g, '\\_')
              .replace(/[ ]+\\/g, '_\\')
              .replace(/[\x00-\x1f?*:";‌​|/<>]+/g, "_")
          ],
          value;

      for(var i = 0; i < values.length; i++) {
        value = values[i];

        if(fs.existsSync(path.join(this.paths.in.data, value))) {
          item.path = value;
          callback(true);
          return;
        }
      }

      // If the file is 0-length and wasn't found, just ignore it.
      if(item.length == 0) {
        callback(false);
        return;
      }

      allGood = false;
      callback(false);
    }).bind(this),
    (function (results){
      if(! allGood) {
        this.log.push(util.format("%s files not found out of %d", results.length, files.length));

        for(var i = 0; i < results.length; i++) {
          this.log.push(util.format("Not found: %s", results[i].path));
        }

        callback("Can't find all files.".bold.red, null);
      }
      else {
        this.torrent.data.files = results;
        this.log.push("All files".green + " accounted for");
        callback(null, null);
      }
    }).bind(this));
};
