
var parseTorrent = require("./parse-torrent");
var verifyFilePresence = require("./verify-file-presence");
var fetchFromTracker = require("./fetch-from-tracker");
var tagFlac = require("./tag-flac");

module.exports = {
  parseTorrent: parseTorrent,
  verifyFilePresence: verifyFilePresence,
  fetchFromTracker: fetchFromTracker,
  tagFlac: tagFlac
};
