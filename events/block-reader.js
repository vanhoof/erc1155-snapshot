"use strict";

const fs = require("fs");
const path = require("path");

const { promisify } = require("util");

const Parameters = require("../parameters").get();

const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const getMinimal = (pastEvents) => {
  const minimalEvents = [];

  for (let i = 0, l = pastEvents.length; i < l; i++) {
    const event = pastEvents[i];

    if (event["event"] === "TransferSingle") {
      minimalEvents.concat(
        Array(Number(event.returnValues["4"])).fill({ transactionHash: event.transactionHash, from: event.returnValues["1"], to: event.returnValues["2"], tokenId: event.returnValues["3"] })
      );
    } else if (event["event"] === "TransferBatch") {
      for (let ii = 0, ll = event.returnValues["4"].length; ii < ll; ii++) {
        minimalEvents.concat(
          Array(Number(event.returnValues["4"][ii])).fill({ transactionHash: event.transactionHash, from: event.returnValues["1"], to: event.returnValues["2"], tokenId: event.returnValues["3"][ii] })
        );
      }
    }
  }

  return minimalEvents;
};

module.exports.getEvents = async (symbol) => {
  const directory = Parameters.eventsDownloadFolder.replace(/{token}/g, symbol);
  var files = await readdirAsync(directory);
  files.sort((a, b) => {
    return parseInt(a.split(".")[0]) - parseInt(b.split(".")[0]);
  });
  let events = [];

  console.log("Parsing files.");

  for await (const file of files) {
    console.log("Parsing ", file);

    const contents = await readFileAsync(path.join(directory, file));
    const parsed = JSON.parse(contents.toString());
    events = events.concat(getMinimal(parsed));
  }

  return events;
};
