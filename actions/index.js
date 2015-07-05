
var parseTorrent = require("./parse-torrent");
var verifyFilePresence = require("./verify-file-presence");
var fetchFromTracker = require("./fetch-from-tracker");
var tagFlac = require("./tag-flac");
var moveOtherFiles = require("./move-other-files");
var downloadCover = require("./download-cover");

module.exports = {
  parseTorrent: parseTorrent,
  verifyFilePresence: verifyFilePresence,
  fetchFromTracker: fetchFromTracker,
  tagFlac: tagFlac,
  moveOtherFiles: moveOtherFiles,
  downloadCover: downloadCover
};
