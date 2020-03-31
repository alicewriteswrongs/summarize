#!/usr/bin/env node

const program = require("commander")
const moment = require("moment")

const  fetchInfo  = require("./src/activity.js")

program
  .description("Summarize your recent github activity")
  .option("-u, --username <code>", "username to check")
  .option(
    "-s, --since <code>",
    'time to check since (if not yesterday). format: "MM-DD-YYYY"'
  )
  .parse(process.argv)

if (!program.username) {
  program.help()
} else {
  const yesterday = program.since
    ? moment(program.since, "MM-DD-YYYY").startOf("day")
    : moment().subtract(1, "day").startOf("day")

  fetchInfo(program.username, yesterday)
}
