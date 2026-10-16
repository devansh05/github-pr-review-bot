import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "github-pr-review-bot" });

export const sampleFunction = inngest.createFunction(
  // create an id and define triggers
  { id: "sample-function", triggers: [{ event: "test/sample.function" }] },
  // create this function
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hi this is inngest! User : ${event.data.email}!` };
  },
);
