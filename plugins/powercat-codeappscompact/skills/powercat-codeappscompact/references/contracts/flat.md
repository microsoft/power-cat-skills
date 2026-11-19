# Flat demo data

**Import:** `createDemoRepository` from `codeappscompact/demo`, or prefer `defineDemoWorkspace` from `codeappscompact/workspace` for integrated binding. **API:** `demo` when the workspace contract is insufficient.

Configure synthetic `seed`, typed scalar fields/defaults, structural `validate` and mutation-only `validateMutation`. Repositories supply scoped collection services and numeric record revisions. Historical reads must remain valid when time or status policy changes; enforce transitions/eligibility on writes.

Read [integrated authoring](../authoring.md) for the working definition pattern and [save](save.md) for rejected writes. Never use this repository and the aggregate string-revision snapshot store to manage the same records. No real authentication, shared production storage or secret storage is provided.
