import { cli, isMain } from './lib.mjs';
import { runWorkflow, workflowSummary } from './workflow.mjs';
import { workflowOptions } from './workflow-options.mjs';

export async function verify(app, browser, output) { return runWorkflow(app, { browser, output }); }
if (isMain(import.meta.url)) await cli(async () => {
  const parsed = workflowOptions(process.argv.slice(2));
  const result = await runWorkflow(parsed.app, parsed.options);
  console.log(workflowSummary(result));
  if (!result.passed) process.exitCode = result.status === 'blocked' ? 2 : 1;
});
