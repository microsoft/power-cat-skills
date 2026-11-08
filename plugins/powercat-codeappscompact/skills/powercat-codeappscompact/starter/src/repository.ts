import { createDemoRepository } from 'codeappscompact/demo';
import { defaults, projectFields, requestFields, seed, validateWorkspace } from './domain.ts';
import type { Drafts } from './domain.ts';
import config from './app-config.json';

export const repository = createDemoRepository<Drafts>({ key: config.storageKey, schemaVersion: 1, defaults, seed, fields: { requests: requestFields, projects: projectFields }, validate: validateWorkspace });
export const services = { requests: repository.service('requests'), projects: repository.service('projects') };
