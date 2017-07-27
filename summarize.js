const GithubAPI = require("github")
const program = require("commander")
const moment = require("moment")
const fs = require('fs');

const github = new GithubAPI()

const getOwnerAndRepo = repoName => ({
  owner: repoName.match(/^([a-z0-9-_]+)\//)[1],
  repo: repoName.match(/\/([a-z0-9-_]+)$/)[1]
})

const fetchInfo = async (username, yesterday) => {
  let activity = await github.activity.getEventsForUser({
    username,
    per_page: 100
  })

  let pushesToMaster = activity.data.filter(
    event =>
      event.type === "PushEvent" &&
      event.payload.ref === "refs/heads/master" &&
      moment(event.created_at).isAfter(yesterday)
  )

  let commits = await Promise.all(
    pushesToMaster.map(async event => {
      const { owner, repo } = getOwnerAndRepo(event.repo.name)

      const commit = await github.gitdata.getCommit({
        sha: event.payload.head,
        repo,
        owner
      })

      return {
        message: commit.data.message,
        repo: repo
      }
    })
  )

  console.log("Yesterday I merged the following:\n")

  commits.forEach(({ message, repo }) => {
    console.log(`- ${message.split("\n")[0]} (${repo})`)
  })
}

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
    ? moment(program.since).startOf("day")
    : moment().subtract(1, "day").startOf("day")

  fetchInfo(program.username, yesterday)
}
