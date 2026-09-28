<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Neighbourhoods That Care
- Data lives in a browser-persisted demo store (src/lib/store.tsx, seed in src/lib/seed.ts); every mutation goes through `mutate()` so audit + notifications stay consistent.
- Role pages are registered in src/components/registry.tsx and served by the single route /app/$page — add a page by adding a NAV entry, not a new route file.
- Matching, conflicts and .ics generation are pure functions in src/lib/logic.ts so they stay deterministic and testable.
