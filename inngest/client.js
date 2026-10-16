import { Inngest } from "inngest";
import { sampleFunction } from "./functions/sample-function";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "github-review-application" });

// Create an empty array where we'll export future Inngest functions
export const functions = [sampleFunction];
