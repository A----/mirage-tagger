var torrentParser = require("parse-torrent-file");
var fs = require("fs");
var util = require("util");

module.exports = function (noop, callback) {
  var torrent = fs.readFileSync(this.torrent.path);
  var basicErrorMessage = "Erroneous torrent file.".bold.red;

  try {
    var data = torrentParser(torrent);

    if(data.infoHash) {
      this.log.push("info hash: " + data.infoHash.green);
    }
    else {
      this.log.push(basicErrorMessage);
      callback("Info hash could not be retrieved.", null);
    }

    if(data.files && data.files.length > 0) {
      this.log.push(util.format("%d files", data.files.length).green + " in this torrent");
    }
    else {
      this.log.push(basicErrorMessage);
      callback("File list could not be retrieved.", null);
    }

    this.torrent.data = data;
    callback(null, null);
  } catch (e) {
    this.log.push(basicErrorMessage);
    callback(e, null);
  }
};
