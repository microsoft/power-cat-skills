# Approved service adapter

**Import:** type `DataService` from `codeappscompact`; collection helpers from `codeappscompact/collections`. **API:** `records`/`collections` only for the adapter being implemented.

Use existing authorized bindings, generated services and platform permissions. Configure only capabilities the adapter actually supports. Confirm service writes, enforce concurrency/authorization at the backend, preserve failures and expose unavailable bindings explicitly. Read [save](save.md).

Do not fabricate a tenant ID, invent a connector, change shared schema or publish without approval. A browser-local transaction wrapper cannot make several remote writes atomic. If the required backend transaction is unavailable, report the gap rather than simulate successful production behavior. Verify authenticated Power Apps behavior separately with approved tools; local checks cannot prove it.
