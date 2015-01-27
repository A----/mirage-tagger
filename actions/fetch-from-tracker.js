var TrackerAPI = require("whatcd");
var util = require("util");

module.exports = function (noop, callback) {
  var client = new TrackerAPI(this.website.url, this.website.user, this.website.password);

  client.torrent({ hash: this.torrent.data.infoHash.toUpperCase() }, (function (err, data) {
    if (err) {
      this.log.push("An error occurred while fetching torrent metadata".bold.red);
      if (data) {
        this.log.push(data);
      }
      callback(err, null);
    }
    else {
      this.log.push("Torrent metadata found.");
      this.log.push("Group ID: " + util.format("%d".green, data.group.id));
      this.log.push("Torrent ID: " + util.format("%d".green, data.torrent.id));

      this.metadata = data;

      setTimeout(function(){
        callback(null, null);
      }, 2000);
    }
  }).bind(this));
};
