# github-pr-review-bot
A simple MVP project to create a bot with bare minimum requirements to do a PR review for github using open Ai SDK.
THis project is mainly to understand how we break our process and tasks into workflows and how we can orchesterate multiple agents working together.

Tech Stack:
NodeJS
Express
Javascript
Inngest
Octo Kit - Official github package to make REST or GraphQL calls on git
LLM (Open Ai or Claude)
Manually triggered Events
CLI Based MVP


# Run the Inngest Dev Server
npx --ignore-scripts=false inngest-cli@latest dev
# You can specify the URL of your development `serve` API endpoint
npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:3000/api/inngest

In the Inngest Dev Server, send this event (replace the values with an existing
pull request):

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
