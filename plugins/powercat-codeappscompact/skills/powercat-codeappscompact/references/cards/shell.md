# Shell and navigation

For synthetic multi-persona apps use **`DemoShell` from `codeappscompact/demo-shell`**. The aggregate scaffold already wires its accessible user selector; supply user options instead of hand-writing another select. **API:** `api-reference.mjs shell`.

```tsx
const navigation = useNavigationGuard(); // from codeappscompact
<DemoShell title={title} items={items} activeId={screen} onNavigate={setScreen}
  users={users} user={user} onUserChange={setUser} navigation={navigation}>
  {content}
</DemoShell>
```

Options are `{value,label,disabledReason?}`. Supply a nonempty list and a user value from that list: the selector uses the closed-choice `FormChoice` preset, not a lookup placeholder. Include role names in demo labels. The literal selector label is `Demo user (simulated role)`. This is not authentication. Parent owns selected user/screen and resets route-specific state on navigation. Pass `navigation.onFormStateChange` into every editor/RecordFlow; the shell guards navigation and persona changes and disables switching during saves. Other buttons that abandon a draft must use `navigation.requestNavigation` too.

For other apps import `AppShell`, `AppErrorBoundary`, `useNavigationGuard` from `codeappscompact`. Supply title, navigation items, active ID, guarded onNavigate and optional host status. Error boundaries report render failures, not successful saves. Real permissions belong in approved adapters/backends, never the demo switcher.

Start with items such as `{ id: 'projects', label: 'Projects' }` and omit `icon`: the shell supplies decorative SVG defaults. Do not substitute visible letters or emoji, which can change accessible names. Use a custom icon only for an actual design requirement and keep it decorative (`aria-hidden`).
