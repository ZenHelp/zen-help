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
  const DEFAULT_LABEL = 'needs-triage';
  const ticketsDir = path.join(process.cwd(), 'tickets');
  const resolvedDir = path.join(process.cwd(), 'resolved');
  const referenceDir = path.join(resolvedDir, 'reference');
  const historyDir = path.join(resolvedDir, 'history');

  // Ensure directories exist
  await Promise.all([
    fs.mkdir(ticketsDir, { recursive: true }),
    fs.mkdir(referenceDir, { recursive: true }),
    fs.mkdir(historyDir, { recursive: true })
  ]);

  const folderName = `#${number}`;
  const ticketFolder = path.join(ticketsDir, folderName);
  const referenceFolder = path.join(referenceDir, folderName);
  const historyFolder = path.join(historyDir, folderName);

  async function moveFolder(src, dest) {
    try {
      await fs.access(src);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.rename(src, dest);
      console.log(`Moved folder from ${src} to ${dest}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Source folder ${src} not found, skipping move.`);
      } else {
        throw error;
      }
    }
  }

  async function updateEvaluationFile(number, details, targetDir = ticketsDir) {
    const folderPath = path.join(targetDir, `#${number}`);
    await fs.mkdir(folderPath, { recursive: true });
    const content = `
### ${details.title}

**Labels**: ${details.labels || 'None'}\\
**Author**: [@${details.author}](https://github.com/${details.author})\\
**Link**: ${details.html_url}\\
    `;
    await fs.writeFile(path.join(folderPath, 'evaluation.md'), content.trim());
    console.log(`Updated evaluation.md for #${number} in ${targetDir}`);
  }

  try {
    if (eventType === 'issues') {
      let { data } = await octokit.issues.get({ owner, repo, issue_number: number });
      let details = {
        title: data.title,
        labels: data.labels.map(label => label.name).join(', ') || 'None',
        author: data.user.login,
        html_url: data.html_url
      };

      if (eventAction === 'opened') {
        if (data.labels.length === 0) {
          await octokit.issues.addLabels({
            owner,
            repo,
            issue_number: number,
            labels: [DEFAULT_LABEL]
          });
          console.log(`Added default label '${DEFAULT_LABEL}' to issue #${number}`);
          // Refetch issue data to include the new label
          const updatedData = await octokit.issues.get({ owner, repo, issue_number: number });
          data = updatedData.data;
          details.labels = data.labels.map(label => label.name).join(', ') || 'None';
        }
        await fs.rm(ticketFolder, { recursive: true, force: true });
        await updateEvaluationFile(number, details);
      } else if (eventAction === 'edited' || eventAction === 'labeled' || eventAction === 'unlabeled') {
        details.labels = data.labels.map(label => label.name).join(', ') || 'None';
        // Only update if the folder exists in tickets/
        if (await fs.access(ticketFolder).then(() => true).catch(() => false)) {
          await updateEvaluationFile(number, details);
        }
      } else if (eventAction === 'closed') {
        const labels = data.labels.map(label => label.name);
        const targetDir = labels.includes(REFERENCE_LABEL) ? referenceFolder : historyFolder;
        await moveFolder(ticketFolder, targetDir);
      } else if (eventAction === 'reopened') {
        const possibleSrc1 = referenceFolder;
        const possibleSrc2 = historyFolder;
        if (await fs.access(possibleSrc1).then(() => true).catch(() => false)) {
          await moveFolder(possibleSrc1, ticketFolder);
        } else if (await fs.access(possibleSrc2).then(() => true).catch(() => false)) {
          await moveFolder(possibleSrc2, ticketFolder);
        } else {
          console.log(`No resolved folder found for #${number}, creating new ticket folder`);
          await updateEvaluationFile(number, details);
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
      await fs.rm(ticketFolder, { recursive: true, force: true });
      await updateEvaluationFile(number, details);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
