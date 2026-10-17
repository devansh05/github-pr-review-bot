import { Inngest } from "inngest";
import { octokit } from "../../lib/github.js";

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
    // create a step with name 'fetch-pull-request-data', and run it
    return await step.run("fetch-pull-request-data", async () => {
      const { owner, repo, pull_number } = event.data;

      try {
        //Now fetch details of pull request with owner repo pull request number
        const pullRequestObj = await octokit.pulls.get({
          owner,
          repo,
          pull_number,
        });

        if (!pullRequestObj) {
          return {
            message: "Pull request not found.",
            skipped: true,
            completed: false,
          };
        }

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
        };

        if (resultObj.state !== "open") {
          return {
            message: "Pull request is not open.",
            skipped: true,
            completed: false,
          };
        }
        return resultObj;
      } catch (error) {
        return {
          message: "Unable to process pull request.",
          error,
          skipped: true,
          completed: false,
        };
      }
    });
  },
);
