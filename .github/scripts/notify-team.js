const { Octokit } = require('@octokit/rest');

(async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const eventType = process.env.EVENT_TYPE;
  const eventAction = process.env.EVENT_ACTION;
  const number = process.env.ISSUE_NUMBER;

  try {
    let labels = [];
    let commentBody = '';

    // Fetch labels
    if (eventType === 'issues') {
      const { data } = await octokit.issues.get({
        owner,
        repo,
        issue_number: number,
      });
      labels = data.labels.map(label => label.name);
      if (eventAction === 'opened') {
        commentBody = `New issue #${number} created. Please review the details in the [tickets/#${number}/evaluation.md](https://github.com/${owner}/${repo}/tree/main/tickets/%23${number}/evaluation.md) file.`;
      } else if (eventAction === 'labeled' || eventAction === 'unlabeled') {
        commentBody = `Labels updated on issue #${number}. Current labels: ${labels.join(', ') || 'None'}. Please review the details in the [tickets/#${number}/evaluation.md](https://github.com/${owner}/${repo}/tree/main/tickets/%23${number}/evaluation.md) file.`;
      }
    } else if (eventType === 'discussion' && eventAction === 'created') {
      const { data } = await octokit.graphql(`
        query($owner: String!, $repo: String!, $number26: Int!) {
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
      commentBody = `New discussion #${number} created. Please review the details in the [tickets/#${number}/evaluation.md](https://github.com/${owner}/${repo}/tree/main/tickets/%23${number}/evaluation.md) file.`;
    } else {
      console.log(`Event ${eventType}.${eventAction} not supported for notifications`);
      return;
    }

    // Map labels to teams (customize as needed)
    const labelToTeam = {
      'general': [''],
      'transparency': [''],
      'bug': [''],
      'theming': ['zen-themes'],
      'userChrome': [''],
      'userContent': [''],
      'mods': ['zen-mods'],
      'requests': ['mod-creation'],
      'assistance': ['mod-creation'],
      'Sine': ['sine'],
      'Silkthemes': ['silkthemes'],
      'Zen': ['zen'],
      'needs-triage': ['triage-team'],
      // Add more mappings as needed
    };

    let teamsToNotify = new Set();
    labels.forEach(label => {
      if (labelToTeam[label]) {
        labelToTeam[label].forEach(team => {
          if (team) teamsToNotify.add(team);
        });
      }
    });

    // If no teams are mapped, notify a default team
    if (teamsToNotify.size === 0) {
      teamsToNotify.add('triage-team');
    }

    // Create comment with team mentions
    const mentions = Array.from(teamsToNotify).map(team => `@${owner}/${team}`).filter(Boolean).join(', ');
    const finalComment = mentions ? `${mentions}. ${commentBody}` : commentBody;

    try {
      if (eventType === 'issues') {
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body: finalComment,
        });
      } else if (eventType === 'discussion') {
        const discussionId = await getDiscussionId(octokit, owner, repo, number);
        await octokit.graphql(`
          mutation($discussionId: ID!, $body: String!) {
            addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
              comment {
                id
              }
            }
          }`, {
          discussionId,
          body: finalComment,
        });
      }
      console.log(`Notified teams: ${Array.from(teamsToNotify).join(', ')}`);
    } catch (commentError) {
      console.error(`Failed to create comment: ${commentError.message}`);
      console.error('This may be due to insufficient permissions for GITHUB_TOKEN. Ensure the workflow has "issues: write" and "discussions: write" permissions.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();

// Helper function to get discussion ID
async function getDiscussionId(octokit, owner, repo, number) {
  try {
    const { data } = await octokit.graphql(`
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          discussion(number: $number) {
            id
          }
        }
      }`, { owner, repo, number: parseInt(number) });
    return data.repository.discussion.id;
  } catch (error) {
    console.error(`Failed to fetch discussion ID: ${error.message}`);
    throw error;
  }
}
