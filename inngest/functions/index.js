import { sampleFunction } from "./sample-function.js";
import { githubPullRequestReview } from "./github-review.js";

// Create an empty array where we'll export future Inngest functions
// Add functions here to avoid creating circular dependencies
export const functions = [sampleFunction, githubPullRequestReview];
