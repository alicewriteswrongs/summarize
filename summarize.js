const GithubAPI = require("github")

const github = new GithubAPI();

const getOwnerAndRepo = repoName => ({
  owner: repoName.match(/^([a-z0-9-_]+)\//)[1],
  repo: repoName.match(/\/([a-z0-9-_]+)$/)[1],
})

const fetchInfo = async () => {
  let activity = await github
    .activity
    .getEventsForUser({ username: 'aliceriot' })

  let pushesToMaster = activity.data.filter(event => (
    event.type === 'PushEvent' &&
    event.payload.ref === 'refs/heads/master'
  ))

  let commits = await Promise.all(pushesToMaster.map(async event => {
    const { owner, repo } = getOwnerAndRepo(event.repo.name);

    const commit = await github.gitdata.getCommit({ 
      sha: event.payload.head,
      repo,
      owner,
    });

    return {
      message: commit.data.message,
      repo: repo
    }
  }));

  console.log('Yesterday I merged the following:\n');
  commits.forEach(({ message, repo }) => {
    console.log(`- ${message.split('\n')[0]} (${repo})`);
  });
};

fetchInfo();
