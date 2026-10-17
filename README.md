# GitHub PR Review Bot

An event-driven proof of concept that reviews a GitHub pull request with an OpenAI agent and posts the result as a PR comment.

The project uses Inngest to split the review into observable, retryable steps: load the pull request, collect every changed file, generate structured feedback, and publish that feedback to GitHub.

## How it works

When the `github/pullrequest.review` event is received, the workflow:

1. Fetches pull request metadata from GitHub.
2. Stops if the pull request is not open or has no changed files.
3. Fetches all changed files and their available patches (up to 100 files per GitHub API page, with pagination handled by Octokit).
4. Sends the PR metadata and changes to the OpenAI Agents SDK.
5. Formats the agent's response into a summary, critical changes, and suggestions.
6. Posts the result as a single comment on the pull request.

> [!NOTE]
> The agent returns an `APPROVE`, `COMMENT`, or `REQUEST_CHANGES` recommendation, but the current workflow always creates a regular PR comment. It does not submit a formal GitHub review or change the PR's review status.

## Tech stack

- Node.js and JavaScript (ES modules)
- Express
- Inngest
- OpenAI Agents SDK
- Octokit REST API client
- Zod

## Prerequisites

- Node.js 22 or newer
- npm
- An OpenAI API key
- A GitHub personal access token that can read the target repository's pull requests and create comments on them
- An existing pull request to review

## Setup

1. Clone the repository and install its dependencies:

   ```bash
   git clone https://github.com/devansh05/github-pr-review-bot.git
   cd github-pr-review-bot
   npm install
   ```

2. Create a `.env` file in the project root:

   ```dotenv
   OPENAI_API_KEY=your_openai_api_key
   GITHUB_PAT=your_github_personal_access_token
   ```

   Keep this file private and never commit real credentials.

## Run locally

The Express app and Inngest Dev Server must run at the same time.

1. Start the application:

   ```bash
   node index.js
   ```

   The server listens on `http://localhost:3000` and exposes the Inngest endpoint at `http://localhost:3000/api/inngest`.

2. In another terminal, start the Inngest Dev Server and point it at the application:

   ```bash
   npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:3000/api/inngest
   ```

3. Open the URL shown by the Inngest CLI (normally `http://localhost:8288`), select **Events**, and send this event after replacing the values with a real pull request:

   ```json
   {
     "name": "github/pullrequest.review",
     "data": {
       "owner": "devansh05",
       "repo": "to-do",
       "pull_number": 1
     }
   }
   ```

4. Follow the function run in the Inngest UI. When it completes, the bot's comment will appear on the pull request.

## Event contract

| Field | Type | Description |
| --- | --- | --- |
| `owner` | string | GitHub account or organization that owns the repository |
| `repo` | string | Repository name without the owner prefix |
| `pull_number` | number | Pull request number |

The event name must be `github/pullrequest.review`.

## Project structure

```text
.
├── agents/
│   └── github-pr-review-agent.js   # Agent instructions and structured output schema
├── inngest/
│   ├── client.js                   # Inngest client served by Express
│   └── functions/
│       ├── github-review.js        # Pull request review workflow
│       ├── index.js                # Registered Inngest functions
│       └── sample-function.js      # Example Inngest function
├── lib/
│   └── github.js                   # Authenticated Octokit client
├── index.js                        # Express entry point
└── package.json
```

## Current scope and limitations

- Reviews are triggered manually through an Inngest event; the GitHub webhook route in `index.js` is only a commented placeholder.
- Feedback is posted as a top-level PR comment, not as inline file comments or a formal approve/request-changes review.
- The complete available patch data is sent to the model in one request, so very large pull requests may exceed model input limits.
- Files for which GitHub omits the `patch` field (for example, some binary or very large files) cannot be reviewed from their contents.
- Running the same event more than once can create duplicate comments.
- The repository currently has no automated test suite.

## Development notes

Inngest also registers a sample function triggered by `test/sample.function`. It is independent of the GitHub review workflow and can be used to verify that the local Inngest setup is working.

The main review implementation is in [`inngest/functions/github-review.js`](inngest/functions/github-review.js), while the agent prompt and response schema are in [`agents/github-pr-review-agent.js`](agents/github-pr-review-agent.js).
