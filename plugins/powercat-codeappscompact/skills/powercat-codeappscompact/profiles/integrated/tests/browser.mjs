import { scenarios } from './acceptance.mjs';
import { runAcceptance } from '../tools/acceptance-scenarios.mjs';

await runAcceptance({ criteriaFile: 'tests/acceptance.json' }, scenarios);
