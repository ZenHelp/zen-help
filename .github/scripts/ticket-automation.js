const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const eventType = process.env.EVENT_TYPE;
  const eventAction = process.env.EVENT_ACTION;
  const number = process.env.ISSUE_NUMBER;

  try {
    // Create tickets folder if it doesn't exist
    const ticketsDir = path.join(process.cwd(), 'tickets');
    await fs.mkdir(ticketsDir, { recursive: true });
    const ticketFolder = path.join(ticketsDir, `#${number}`);

    if (eventType === 'issues' && eventAction === 'closed') {
      // Delete the ticket folder
      await fs.rm(ticketFolder, { recursive: true, force: true });
      console.log(`Deleted ticket folder for closed issue #${number}`);
    } else {
      // Fetch issue or discussion details
      let title, labels, author, html_url;
      if (eventType === 'issues') {
        const { data } = await octokit.issues.get({
          owner,
          repo,
          issue_number: number,
        });
        title = data.title;
        labels = data.labels.map(label => label.name).join(', ') || 'None';
        author = data.user.login;
        html_url = data.html_url;
      } else if (eventType === 'discussion') {
        const { data } = await octokit.graphql(`
          query($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
              discussion(number: $number) {
                title
                author {
                  login
                }
                url
                labels(first: 100) {
                  nodes {
                    name
                  }
                }
              }
            }
          }`, { owner, repo, number: parseInt(number) });
        title = data.repository.discussion.title;
        labels = data.repository.discussion.labels.nodes.map(label => label.name).join(', ') || 'None';
        author = data.repository.discussion.author.login;
        html_url = data.repository.discussion.url;
      }

      // Remove the folder if it exists (ensures a fresh state)
      await fs.rm(ticketFolder, { recursive: true, force: true });
      // Create the folder
      await fs.mkdir(ticketFolder, { recursive: true });
      // Create evaluation.md content
      const content = `
### ${title}

**Labels**: ${labels}\\
**Author**: [@${author}](https://github.com/${author})\\
**Link**: ${html_url}\\
      `;
      // Write evaluation.md file
      await fs.writeFile(path.join(ticketFolder, 'evaluation.md'), content.trim());
      console.log(`Created folder and evaluation.md for #${number}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
