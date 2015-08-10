var path = require("path");
var fs = require("fs");
var util = require("util");
var async = require("async");

module.exports = function (noop, callback) {
  var files = this.torrent.data.files;

  async.reject(
    files,
    (function (item, callback) {
      var values = [
            item.path,
            item.path.replace(/\\[ ]+/, '\\')
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

      callback(false);
    }).bind(this),
    (function (results){
      if(results.length > 0) {
        this.log.push(util.format("%s files not found out of %d", results.length, files.length));
        callback("Can't find all files.".bold.red, null);
      }
      else {
        this.log.push("All files".green + " accounted for");
        callback(null, null);
      }
    }).bind(this));
};
