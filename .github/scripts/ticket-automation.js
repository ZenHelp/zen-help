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

  async function moveFolder(src, dest) {
    try {
      await fs.access(src);
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

  async function updateEvaluationFile(number, details) {
    const folderPath = path.join(ticketsDir, `#${number}`);
    const content = `
### ${details.title}

**Labels**: ${details.labels || 'None'}\\
**Author**: [@${details.author}](https://github.com/${details.author})\\
**Link**: ${details.html_url}\\
    `;
    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(path.join(folderPath, 'evaluation.md'), content.trim());
    console.log(`Updated evaluation.md for issue #${number}`);
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
        const folderPath = path.join(ticketsDir, `#${number}`);
        await fs.rm(folderPath, { recursive: true, force: true });
        await updateEvaluationFile(number, details);
      } else if (eventAction === 'edited' || eventAction === 'labeled' || eventAction === 'unlabeled') {
        details.labels = data.labels.map(label => label.name).join(', ') || 'None';
        await updateEvaluationFile(number, details);
      } else if (eventAction === 'closed') {
        const labels = data.labels.map(label => label.name);
        const targetDir = labels.includes(REFERENCE_LABEL) ? referenceDir : historyDir;
        const src = path.join(ticketsDir, folderName);
        const dest = path.join(targetDir, folderName);
        await moveFolder(src, dest);
      } else if (eventAction === 'reopened') {
        const possibleSrc1 = path.join(referenceDir, folderName);
        const possibleSrc2 = path.join(historyDir, folderName);
        const dest = path.join(ticketsDir, folderName);
        if (await fs.access(possibleSrc1).then(() => true).catch(() => false)) {
          await moveFolder(possibleSrc1, dest);
        } else if (await fs.access(possibleSrc2).then(() => true).catch(() => false)) {
          await moveFolder(possibleSrc2, dest);
        } else {
          console.log(`No resolved folder found for #${number}, creating new ticket folder`);
          await updateEvaluationFile(number, details);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
