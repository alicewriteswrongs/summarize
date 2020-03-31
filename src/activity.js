#!/usr/bin/env node

const GithubAPI = require("github")
const program = require("commander")
const moment = require("moment")

const github = new GithubAPI()

// the different kinds of events that can show up in the activity stream
const PullRequestReviewCommentEvent = "PullRequestReviewCommentEvent"
const IssueCommentEvent = "IssueCommentEvent"
const DeleteEvent = "DeleteEvent"
const PullRequestEvent = "PullRequestEvent"
const CreateEvent = "CreateEvent"
const PushEvent = "PushEvent"
const IssuesEvent = "IssuesEvent"
const WatchEvent = "WatchEvent"

const getOwnerAndRepo = repoName => ({
  owner: repoName.match(/^([a-z0-9-_]+)\//)[1],
  repo: repoName.match(/\/([a-z0-9-_]+)$/)[1]
})

const fetchActivity = async (username, yesterday) => {
  const activity = await github.activity.getEventsForUser({
    username,
    per_page: 200
  })

  return activity.data.filter(event =>
      moment(event.created_at).isAfter(yesterday)
  )
}

const fetchCommits = async events => {
  const commits = await Promise.all(
    events.map(async event => {
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
  return commits
}

const formatMerges = async (activity ) => {
  const pushesToMaster = activity.filter(
    event =>
      event.type === PushEvent &&
      event.payload.ref === "refs/heads/master"
  )

  const commits = await fetchCommits(pushesToMaster)

  if (commits.length !== 0) {
    let message = "Yesterday I merged the following:\n"
    commits.forEach(({ message, repo }) => {
      message += `- ${message.split("\n")[0]} (${repo})`
    })
    return message
  } else {
    return ""
  }
}

const formatReviews = async (activity ) => {
  const events = activity.filter(
    event =>
    event.type === PullRequestReviewCommentEvent
  )

  if (events.length !== 0) {
    let message = "Yesterday I reviewed:\n"

    const reviews = new Set

    events.forEach(event => {
      const { pull_request } = event.payload
      const { title } = pull_request
      const name = pull_request.user.login
      const repoName = event.payload.pull_request.head.repo.name

      reviews.add(`  - PR "${title}" for ${name} in ${repoName}\n`)
    })

    return message + [...reviews].join("")
  } else {
    return ""
  }
}


const fetchInfo = async (username, yesterday) => {
  const activity = await fetchActivity(username, yesterday)

  console.log(activity)

  const merges = await formatMerges(activity )
  console.log(merges)

  const reviews = await formatReviews(activity)
  console.log(reviews)
}

module.exports = fetchInfo
