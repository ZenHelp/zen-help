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

  const REFERENCE_LABEL = 'reference';
  const ticketsDir = path.join(process.cwd(), 'tickets');
  const resolvedDir = path.join(process.cwd(), 'resolved');
  const referenceDir = path.join(resolvedDir, 'reference');
  const historyDir = path.join(resolvedDir, 'history');

  // Create directories if they don't exist
  await fs.mkdir(ticketsDir, { recursive: true });
  await fs.mkdir(referenceDir, { recursive: true });
  await fs.mkdir(historyDir, { recursive: true });

  const folderName = `#${number}`;

  async function moveFolder(src, dest) {
    try {
      await fs.access(src, fs.constants.F_OK);
      await fs.rename(src, dest);
      console.log(`Moved folder from ${src} to ${dest}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Source folder ${src} does not exist, skipping move.`);
      } else {
        throw error;
      }
    }
  }

  async function createTicketFolder(number, details) {
    const folderPath = path.join(ticketsDir, `#${number}`);
    await fs.rm(folderPath, { recursive: true, force: true });
    await fs.mkdir(folderPath, { recursive: true });
    const content = `
### ${details.title}

**Labels**: ${details.labels}\\
**Author**: [@${details.author}](https://github.com/${details.author})\\
**Link**: ${details.html_url}
    `;
    await fs.writeFile(path.join(folderPath, 'evaluation.md'), content.trim());
  }

  try {
    if (eventType === 'issues') {
      if (eventAction === 'opened') {
        const { data } = await octokit.issues.get({ owner, repo, issue_number: number });
        if (data.labels.length === 0) {
          const defaultLabel = 'needs-triage';
          await octokit.issues.addLabels({
            owner,
            repo,
            issue_number: number,
            labels: [defaultLabel]
          });
          console.log(`Added default label '${defaultLabel}' to issue #${number}`);
        }
        const details = {
          title: data.title,
          labels: data.labels.map(label => label.name).join(', ') || 'None',
          author: data.user.login,
          html_url: data.html_url
        };
        await createTicketFolder(number, details);
      } else if (eventAction === 'closed') {
        const { data } = await octokit.issues.get({ owner, repo, issue_number: number });
        const labels = data.labels.map(label => label.name);
        const targetDir = labels.includes(REFERENCE_LABEL) ? referenceDir : historyDir;
        const src = path.join(ticketsDir, folderName);
        const dest = path.join(targetDir, folderName);
        await moveFolder(src, dest);
      } else if (eventAction === 'reopened') {
        const possibleSrc1 = path.join(referenceDir, folderName);
        const possibleSrc2 = path.join(historyDir, folderName);
        const dest = path.join(ticketsDir, folderName);
        if (await fs.access(possibleSrc1, fs.constants.F_OK).then(() => true).catch(() => false)) {
          await moveFolder(possibleSrc1, dest);
        } else if (await fs.access(possibleSrc2, fs.constants.F_OK).then(() => true).catch(() => false)) {
          await moveFolder(possibleSrc2, dest);
        } else {
          console.log(`Ticket folder not found in resolved directories for #${number}`);
        }
      }
    } else if (eventType === 'discussion' && eventAction === 'created') {
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
      const details = {
        title: data.repository.discussion.title,
        labels: data.repository.discussion.labels.nodes.map(label => label.name).join(', ') || 'None',
        author: data.repository.discussion.author.login,
        html_url: data.repository.discussion.url
      };
      await createTicketFolder(number, details);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
