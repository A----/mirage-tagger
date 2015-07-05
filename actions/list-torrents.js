var util = require("util");

module.exports = function (noop, callback) {

  var torrentPath = this.paths.in.torrents;

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

  this.torrent.files = torrentFiles;

  console.log(util.format("\n%s torrent file(s) found out of %d", torrentFiles.length, inDirContent.length));

  callback(null, null);
};
