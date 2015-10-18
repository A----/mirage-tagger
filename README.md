# mirage-tagger

Tags your FLAC, downloads covers. That's pretty much it.

## Installation

Here's what you have to do:
* Download NodeJS and configure it;
* Grab yourself a copy of the repository;
* Navigate in the right folder and do a `npm install`;
* That should be it.

## Usage

Proper configuration first:
* Copy `local.json.sample` to `local.json`;
* Edit it, you should be able to figure out what you should put where;
* You can't commit empty directories with `git`, so you'll have to create the following directories: `in\data`, `in\torrents`, `out\data`, `out\torrents`;

Now to run it:
* Get yourself a cup of your preferred beverage;
* Dump your files in the `in` subfolders;
* Do a `npm start`;
* Keep an eye on what's doing what while drinking said beverage.
