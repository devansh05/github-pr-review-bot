import { Inngest } from "inngest";
import { octokit } from "../../lib/github.js";
import { run } from "@openai/agents";
import { githubPullrequestReviewAgent } from "../../agents/github-pr-review-agent.js";

export const inngest = new Inngest({ id: "github-pr-review-bot" });

/**
  INNGEST EVENT STRUCTURE

  Event: {
  data: {
    "owner": "devansh"
    "repo": "to-do",
    "pull_number": 1
  }
}

SMAPLE EVENT:
{
  "data": {
    "owner": "devansh05", 
    "repo": "to-do", 
    "pull_number": "1"
  }
}
 */

export const githubPullRequestReview = inngest.createFunction(
  // create an id and define triggers
  {
    id: "github-review-bot-function",
    triggers: [{ event: "github/pullrequest.review" }],
  },
  // create this function
  async ({ event, step }) => {
    //get info from event triggered
    const { owner, repo, pull_number } = event.data;

    // create a step with name 'fetch-pull-request-data', and run it
    // 1. Fetch the Pull Request Information
    const pullRequestInfo = await step.run(
      "fetch-pull-request-data",
      async () => {
        try {
          //Now fetch details of pull request with owner repo pull request number
          const pullRequestObj = await octokit.pulls.get({
            owner,
            repo,
            pull_number,
          });

          const resultObj = {
            id: pullRequestObj.data.id,
            title: pullRequestObj.data.title,
            state: pullRequestObj.data.state,
            number: pullRequestObj.data.number,
            comments: pullRequestObj.data.comments,
            url: pullRequestObj.data.url,
            diffUrl: pullRequestObj.data.diff_url,
            changes: pullRequestObj.data.changed_files,
            fileChanges: pullRequestObj.data.fileChanges,
            commits: pullRequestObj.data.commits,
            errors: pullRequestObj.data.errors,
            cicd: pullRequestObj.data.cicd,
            head: {
              ref: pullRequestObj.data.head.ref,
              sha: pullRequestObj.data.head.sha,
            },
          };
          return resultObj;
        } catch (error) {
          return {
            message: "Unable to process pull request.",
            error,
            skipped: true,
            completed: false,
          };
        }
      },
    );

    if (!pullRequestInfo)
      return {
        message: "Pull request not found.",
        skipped: true,
        completed: false,
      };

    if (pullRequestInfo.state !== "open")
      return {
        message: "Pull request is not open.",
        skipped: true,
        completed: false,
      };

    // Step 2 Fetch and Review file changes from PR
    const changes = await step.run("fetch-pr-changes", async () => {
      const changesResultArr = await octokit.paginate(octokit.pulls.listFiles, {
        owner,
        repo,
        pull_number,
        per_page: 100,
      });

      return changesResultArr.map((change) => ({
        filename: change.filename,
        status: change.status,
        changes: change.changes,
        patch: change.patch,
        additions: change.additions,
        deletions: change.deletions,
        previous_filename: change.previous_filename,
      }));
    });

    if (changes.length === 0)
      return { message: "There are no changes in this PR", skipped: true };

    // Step 3 Run PR through Ai Agent for review
    const llmReviewResponse = await step.run("fetch-llm-response", async () => {
      const llmResponse = await run(
        githubPullrequestReviewAgent,
        `
        Pull Request Information:
        ${JSON.stringify(pullRequestInfo, null, 2)}
        \n\n
        Changes:
        ${JSON.stringify(changes, null, 2)}
      `,
      );
      return {
        result: llmResponse.finalOutput,
      };
    });

    // Step 4 : Add the review comments to github pr commit
  return await step.run("post-comment", async () => {
      const { criticalFixes, suggestions, content } = llmReviewResponse.result;

      const sections = [content];

      if (criticalFixes?.length)
        sections.push(
          `**Critical Changes:**\n${criticalFixes.map((fix) => `- ${fix}`).join("\n")}`,
        );

      if (suggestions?.length)
        sections.push(
          `**Suggestions:**\n${suggestions.map((suggestion) => `- ${suggestion}`).join("\n")}`,
        );

      const comment = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: sections.join("\n\n"),
      });

      return {
        commentId: comment.data.id,
        commentUrl: comment.data.html_url,
      };
    });
  }, // end of inngest function
);
