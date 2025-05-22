const { Octokit } = require('@octokit/rest');

(async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const eventType = process.env.EVENT_TYPE;
  const number = process.env.ISSUE_NUMBER;

  try {
    let labels = [];
    let commentBody = '';

    // Fetch labels and determine teams to notify
    if (eventType === 'issues') {
      const { data } = await octokit.issues.get({
        owner,
        repo,
        issue_number: number,
      });
      labels = data.labels.map(label => label.name);
      commentBody = `New issue #${number} created. Please review the details in the [tickets/#${number}/evaluation.md](https://github.com/ZenHelp/zen-help/tree/main/tickets/#${number}/evaluation.md) file.`;
    } else if (eventType === 'discussion') {
      const { data } = await octokit.graphql(`
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            discussion(number: $number) {
              labels(first: 100) {
                nodes {
                  name
                }
              }
            }
          }
        }`, { owner, repo, number: parseInt(number) });
      labels = data.repository.discussion.labels.nodes.map(label => label.name);
      commentBody = `New discussion #${number} created. Please review the details in the [tickets/#${number}/evaluation.md](https://github.com/ZenHelp/zen-help/tree/main/tickets/#${number}/evaluation.md) file.`;
    }

    // Map labels to teams (customize this mapping as needed)
    const labelToTeam = {
      'bug': ['backend-team', 'qa-team'],
      'feature': ['frontend-team', 'product-team'],
      'enhancement': ['zen-mods'],
      // Add more mappings as needed
    };

    let teamsToNotify = new Set();
    labels.forEach(label => {
      if (labelToTeam[label]) {
        labelToTeam[label].forEach(team => teamsToNotify.add(team));
      }
    });

    // If no specific teams are mapped, notify a default team
    if (teamsToNotify.size === 0) {
      teamsToNotify.add('dev-team'); // Default team
    }

    // Notify teams by adding a comment
    const mentions = Array.from(teamsToNotify).map(team => `@${owner}/${team}`).join(' ');
    const finalComment = `${mentions}. ${commentBody}`;

    if (eventType === 'issues') {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: number,
        body: finalComment,
      });
    } else if (eventType === 'discussion') {
      await octokit.graphql(`
        mutation($discussionId: ID!, $body: String!) {
          addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
            comment {
              id
            }
          }
        }`, {
        discussionId: await getDiscussionId(octokit, owner, repo, number),
        body: finalComment,
      });
    }

    console.log(`Notified teams: ${Array.from(teamsToNotify).join(', ')}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();

// Helper function to get discussion ID
async function getDiscussionId(octokit, owner, repo, number) {
  const { data } = await octokit.graphql(`
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
        }
      }
    }`, { owner, repo, number: parseInt(number) });
  return data.repository.discussion.id;
}
