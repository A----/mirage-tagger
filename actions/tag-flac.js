var flacMetadata = require("flac-metadata");
var util = require("util");
var fs = require("fs");
var path = require("path");
var titleCase = require("title-case");
var async = require("async");
var fsTools = require("fs-tools");
var natural = require("natural");
var Entities = require('html-entities').AllHtmlEntities;

/*
Resources for FLAC tagging:
 * http://en.wikipedia.org/wiki/Vorbis_comment
 * https://wiki.xiph.org/index.php/VorbisComment#Recommended_field_names
 * http://xiph.org/vorbis/doc/v-comment.html
 * http://age.hobba.nl/audio/mirroredpages/ogg-tagging.html
 * https://wiki.xiph.org/Field_names
 * http://www.legroom.net/2009/05/09/ogg-vorbis-and-flac-comment-field-recommendations
*/

var titleCase = function(str) {
  return str
    .replace(/[.]/g, " ")
    .replace(/\s{2, }/g, " ")
    .trim()
    .replace(/^.| ./g, function(l) {
      return l.toUpperCase();
    });
};

var releaseTypes = {
  "1": "Album",
  "3": "Soundtrack",
  "5": "EP",
  "6": "Anthology",
  "7": "Compilation",
  "8": "DJ Mix",
  "9": "Single",
  "11": "Live album",
  "13": "Remix",
  "14": "Bootleg",
  "15": "Interview",
  "16": "Mixtape",
  "21": "Unknown",
  "22": "Concert recording",
  "23": "Demo"
};

var actions = {
  // Tags will be replaced in any case if present
  FORCE_DROP: "FORCE_DROP",
  // Tags will be kept in any case in existing tag is present
  FORCE_KEEP: "FORCE_KEEP",
  // For each value for this field, a Dice coefficient will be computed
  // and the value will be replaced if said distance is comprised between 0.70 and 1
  // (not included)
  DICECOEFFICIENT_REPLACE: "DICECOEFFICIENT_REPLACE"
};

var actionsForFields = {
  "WCD_ARTIST_ID": actions.FORCE_KEEP,
  "WCD_DJ_ID": actions.FORCE_KEEP,
  "WCD_CONDUCTOR_ID": actions.FORCE_KEEP,
  "WCD_COMPOSER_ID": actions.FORCE_KEEP,
  "WCD_PERFORMER_ID": actions.FORCE_KEEP,
  "WCD_PRODUCER_ID": actions.FORCE_KEEP,
  "WCD_GROUP_ID": actions.FORCE_KEEP,
  "WCD_TORRENT_ID": actions.FORCE_KEEP,

  "ARTIST": actions.DICECOEFFICIENT_REPLACE,
  "DJ": actions.DICECOEFFICIENT_REPLACE,
  "CONDUCTOR": actions.DICECOEFFICIENT_REPLACE,
  "COMPOSER": actions.DICECOEFFICIENT_REPLACE,
  "PERFORMER": actions.DICECOEFFICIENT_REPLACE,
  "PRODUCER": actions.DICECOEFFICIENT_REPLACE,

  "ALBUMARTIST": actions.FORCE_DROP,
  "ALBUM": actions.FORCE_DROP,
  "DATE": actions.FORCE_DROP,
  "LABEL": actions.FORCE_DROP,
  "LABELNO": actions.FORCE_DROP,
  "SOURCEMEDIA": actions.FORCE_DROP,
  "RELEASEVERSION": actions.FORCE_DROP,
  "RELEASETYPE": actions.FORCE_DROP,
  "RELEASEDATE": actions.FORCE_DROP,

  "GENRE": actions.FORCE_DROP
};

var entities = new Entities();

module.exports = function (noop, callback) {

  // We'll try not to change this but heh.
  var defaultVendor = "reference libFLAC 1.2.1 20070917";
  var comments = {};

  var addComment = function (comments, field, value, decodeEntities) {
    if(value) {
      if (!comments[field]) {
        comments[field] = [];
      }

      var decodedValue;
      if(decodeEntities) {
        decodedValue = "" + entities.decode(value);
      }
      else {
        decodedValue = "" + value;
      }

      if(comments[field].indexOf(decodedValue) == -1) {
        comments[field].push(decodedValue);
      }
    }
  };

  var addArtistComment = function (comments, field, arr) {
    var artist, artistName;
    for(var i = 0; i < arr.length; i++) {
      artist = arr[i];
      // Removes the japanese translation sometimes added after japanese artist names
      // That might have to be done with other non-western characters (arabic, …)
      artistName = artist.name.replace(/ \(([一-龠ぁ-ゔァ-ヴーａ-ｚＡ-Ｚ０-９々〆〤]+)\)$/, "");
      addComment(comments, field, artistName);
      addComment(comments, "WCD_" + field + "_ID", artist.id);
    }
  };

  var musicInfo = this.metadata.group.musicInfo;

  // In the recommandations, there should be only one of this, but heh, it's 2015
  // Recs: http://age.hobba.nl/audio/mirroredpages/ogg-tagging.html
  addArtistComment(comments, "ARTIST", musicInfo.artists);
  addArtistComment(comments, "DJ", musicInfo.dj); // Not in the recs
  addArtistComment(comments, "CONDUCTOR", musicInfo.conductor);
  addArtistComment(comments, "COMPOSER", musicInfo.composers);
  addArtistComment(comments, "PERFORMER", musicInfo.with);
  addArtistComment(comments, "PRODUCER", musicInfo.producer); // Not in the recs either

  // Not in recs, but they're written on papyrus
  if(musicInfo.artists.length > 2) {
    addComment(comments, "ALBUMARTIST", "Various Artists");
  }
  else if(musicInfo.artists.length == 2) {
    addComment(comments, "ALBUMARTIST", musicInfo.artists[0].name + " & " + musicInfo.artists[1].name);
  }
  else if(musicInfo.artists.length == 1) {
    addComment(comments, "ALBUMARTIST", musicInfo.artists[0].name);
  }

  // Not in the recs, obviously.
  addComment(comments, "WCD_GROUP_ID", this.metadata.group.id);
  addComment(comments, "WCD_TORRENT_ID", this.metadata.torrent.id);

  addComment(comments, "ALBUM", this.metadata.group.name, true);
  addComment(comments, "DATE", this.metadata.group.year);
  addComment(comments, "LABEL", this.metadata.torrent.remasterRecordLabel || this.metadata.group.recordLabel, true);
  addComment(comments, "LABELNO", this.metadata.torrent.remasterCatalogueNumber || this.metadata.group.catalogueNumber, true);
  addComment(comments, "SOURCEMEDIA", this.metadata.torrent.media);
  addComment(comments, "RELEASEVERSION", this.metadata.torrent.remasterTitle, true); // No es en las recs.
  addComment(comments, "RELEASETYPE", releaseTypes[this.metadata.group.releaseType]); // Nein in der recs.
  // We should be able to set multiple DATE entries, but I doubt anyone follows the recommandations.
  addComment(comments, "RELEASEDATE", this.metadata.torrent.remasterYear);

  var genre;
  for(var i = 0; i < this.metadata.group.tags.length; i++) {
    genre = this.metadata.group.tags[i] || "";
    genre = genre.replace(".", " ");
    addComment(comments, "GENRE", titleCase(genre));
  }

  var files = this.torrent.data.files;

  async.eachSeries(files, (function(file, callback) {
    var basename,
        reader,
        writer,
        processor;

    if (! /\.flac$/.test(file.name)) {
      callback();
      return;
    }

    dirname = path.dirname(path.join(this.paths.out.data, file.path));
    if(!fs.existsSync(dirname)) {
      fsTools.mkdirSync(dirname);
      this.log.push("Creating directory " + dirname.green);
    }

    this.log.push("Processing " + file.path.cyan);

    reader = fs.createReadStream(path.join(this.paths.in.data, file.path));
    writer = fs.createWriteStream(path.join(this.paths.out.data, file.path));
    processor = new flacMetadata.Processor({ parseMetaDataBlocks: true });

    var mdbVorbis;
    var vendor;

    var existingComments = {},
        comment,
        indexOf,
        finalComments,
        message,
        action,
        found;

    var context = this,
        isLast = false;

    processor.on("preprocess", function(mdb) {
      // Remove existing VORBIS_COMMENT block, if any.
      if (mdb.type === flacMetadata.Processor.MDB_TYPE_VORBIS_COMMENT) {
        mdb.remove();
      }
      if (mdb.isLast) {
        mdb.isLast = false;
        isLast = true;
      }
    });

    processor.on("postprocess", (function (mdb) {

      if (mdb.type === flacMetadata.Processor.MDB_TYPE_VORBIS_COMMENT) {
        vendor = vendor || mdb.vendor;
        for(var i = 0; i < mdb.comments.length; i++) {
          comment = mdb.comments[i];
          indexOf = comment.indexOf("=");
          if(indexOf > -1 && indexOf < (comment.length - 1) ) {
            addComment(existingComments, comment.substring(0, indexOf).toUpperCase(), comment.substring(indexOf + 1));
          }
        }

        // Remove existing VORBIS_COMMENT block
        mdb.remove();
      }

      if (isLast) {
        finalComments = [];

        for(var field in comments) {
          message = field + ":";
          action = actionsForFields[field] || actions.FORCE_KEEP;

          if(action == actions.FORCE_DROP || existingComments[field] === undefined || existingComments[field].length == 0) {
            for(var i = 0; i < (existingComments[field] ? existingComments[field].length : 0); i++) {
              message += " >>>" + existingComments[field][i].red;
            }

            for(var i = 0; i < comments[field].length ; i++) {
              finalComments.push(field + "=" + comments[field][i]);
              message += " <<<" + comments[field][i].green;
            }
          }
          else if(action == actions.DICECOEFFICIENT_REPLACE) {
            for(var i = 0; i < existingComments[field].length; i++) {
              found = false;
              for(var j = 0; j < comments[field].length; j++) {
                if(existingComments[field][i] == comments[field][j]) {
                  message += " >>><<<" + existingComments[field][i].cyan;
                  finalComments.push(field + "=" + existingComments[field][i]);
                  found = true;
                  break;
                }
                else if(natural.DiceCoefficient(existingComments[field][i].toLowerCase(), comments[field][j].toLowerCase()) > 0.70) {
                  message += " >>>" + existingComments[field][i].red + " <<<" + comments[field][j].green;
                  finalComments.push(field + "=" + comments[field][j]);
                  found = true;
                  break;
                }
              }

              if(found == false) {
                finalComments.push(field + "=" + existingComments[field][i]);
                message += " >>>" + existingComments[field][i].green;
              }
            }

            if(comments[field].length == 1 && found == false || comments[field].length > 1) {
              message += " (some input may have been dropped)";
            }
          }

          context.log.push(message);
        }

        for(var field in existingComments) {
          action = actionsForFields[field] || actions.FORCE_KEEP;

          if(action == actions.FORCE_KEEP || comments[field] === undefined || comments[field].length == 0) {
            message = field + ":";

            for(var i = 0; i < (comments[field] ? comments[field].length : 0); i++) {
              message += " <<<" + comments[field][i].red;
            }

            for(var i = 0; i < existingComments[field].length ; i++) {
              finalComments.push(field + "=" + existingComments[field][i]);
              message += " >>>" + existingComments[field][i].green;
            }

            context.log.push(message);
          }
        }

        // Add new VORBIS_COMMENT block as last metadata block.
        mdbVorbis = flacMetadata.data.MetaDataBlockVorbisComment.create(true, vendor || defaultVendor, finalComments);
        this.push(mdbVorbis.publish());
      }
    }));

    reader.pipe(processor).pipe(writer);

    writer.on('finish', callback);

  }).bind(this),
  (function(err) {
    if(err) {
      this.log.push("An error occured while tagging a file".red.bold);
      callback(err, null);
    }
    else {
      callback(null, null);
    }
  }).bind(this));

};
