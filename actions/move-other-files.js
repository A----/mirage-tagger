var flacMetadata = require("flac-metadata");
var util = require("util");
var fs = require("fs");
var path = require("path");
var titleCase = require("title-case");
var async = require("async");
var fsTools = require("fs-tools");
var natural = require("natural");

module.exports = function (noop, callback) {

  var files = this.torrent.data.files;

  var basename,
      reader,
      writer,
      processor;

  async.eachSeries(files, (function(file, callback) {

    if (/\.flac$/.test(file.name)) {
      callback();
      return;
    }

    this.log.push("Moving " + file.path.cyan);
    
    fsTools.copy(
      path.join(this.paths.in.data, file.path),
      path.join(this.paths.out.data, file.path),
      callback);

  }).bind(this),
  (function(err) {
    if(err) {
      this.log.push("An error occured while copying a file".red.bold);
      callback(err, null);
    }
    else {
      callback(null, null);
    }
  }).bind(this));

};
