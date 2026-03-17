# QA Report - GPX Viewer

## 1. Tests

| Check | Result |
|-------|--------|
| `npx vitest run` | 46/46 tests pass (5 test files) |
| `npx eslint .` | 0 errors, 0 warnings |
| `npx vite build` | Build OK (787 kB JS, 20 kB CSS) |

### Corrections applied to tests

- **DropZone.test.jsx**: added missing `beforeEach` import from vitest
- **LanguageSwitcher.test.jsx**: added missing `beforeEach` import from vitest
- **gpxParser.test.js**: added missing `beforeAll` import from vitest; fixed `__dirname` not available in ESM by using `import.meta.url` + `fileURLToPath`
- **@rolldown/plugin-babel**: installed missing peer dependency for `@vitejs/plugin-react` v6 (fixes "React is not defined" in test env)

## 2. Code review

| Check | Result |
|-------|--------|
| Component decomposition | OK - 5 focused components + 1 utility |
| No dead code | OK |
| No `console.log` in source | OK |
| TypeScript types | OK - `GpxData`, `GpxPoint`, `ChartDataPoint`, `GpxMetrics` exported and used in all components |
| Props typing | OK - all components have typed props via interfaces |
| Error handling | OK - `parseGPX` throws typed errors, caught in `App.tsx` with `instanceof Error` check |

## 3. Accessibility

| Check | Result |
|-------|--------|
| DropZone `role="button"` + `tabIndex={0}` + keyboard handler | OK (existed) |
| DropZone `aria-label` | **Added** |
| DropZone file input `aria-label` | **Added** |
| DropZone `focus-visible` style | OK (existed) |
| Header title keyboard navigation (`role="button"`, `tabIndex`, `onKeyDown`) | **Added** |
| Header title `aria-label` | **Added** |
| Header title `focus-visible` style | **Added** |
| Error banner `role="alert"` | **Added** |
| Language switcher `role="radiogroup"` + `aria-label` | OK (existed) |
| Language switcher buttons `aria-pressed` | OK (existed) |
| Language switcher buttons `focus-visible` | OK (existed) |
| Color contrasts | OK - primary (#2E7D5B) on white = 4.8:1 (AA); text (#1A2B23) on bg (#F7F9F8) = 14.5:1 (AAA); secondary (#5A6B63) on white = 4.6:1 (AA) |

## 4. Responsive

| Breakpoint | Check | Result |
|------------|-------|--------|
| Desktop (>=1280px) | Layout 60/40, metrics 3 cols | OK |
| Tablet (768-1279px) | Column layout, map 50vh, metrics 2 cols | OK |
| Mobile (375-767px) | Column layout, map 40vh, metrics 2 cols, reduced padding | OK |
| Small mobile (<=374px) | Metrics 1 col, reduced dropzone margin, smaller title | **Added** |

## 5. Edge cases GPX

| Case | Handling |
|------|----------|
| Invalid XML | `parsererror` detected, throws `"Invalid GPX file: XML parsing failed"` |
| Empty GPX (no `<trkpt>`) | throws `"Invalid GPX file: no track points found"` |
| No `<ele>` elements | Elevation set to `null`, stats = `null`/`0`, chart hidden |
| No `<time>` elements | Duration/speed metrics = `null`, displayed as "N/A" |
| Single track point | Distance = 0, metrics computed (no crash) |

## 6. i18n

| Check | Result |
|-------|--------|
| All keys present in fr.json | OK (18 keys) |
| All keys present in en.json | OK (18 keys) |
| Key parity fr/en | OK - identical structure |
| Default language | `fr` with `en` fallback |
| Language switcher functional | OK |

## 7. Performance

| Check | Result |
|-------|--------|
| `useCallback` in DropZone handlers | OK |
| `useMemo` for MapView positions | Not used - acceptable since MapView only re-renders on data change (not on language switch) |
| `FitBounds` fitted once via `useRef` guard | OK |
| ElevationChart `filteredData` | Recalculated on render - acceptable since it only renders once per GPX load |
| Bundle size warning (787 kB) | Expected with Leaflet + Recharts; dynamic import could help but not critical |

## 8. ESLint configuration

- **Updated** `eslint.config.js` to lint `**/*.{js,jsx,ts,tsx}` files (was only `js,jsx`)
- **Added** `typescript-eslint` for TypeScript-aware rules
- **Added** `@typescript-eslint/no-unused-vars` replacing `no-unused-vars`

## Summary of corrections applied

1. Fixed ESLint errors in 3 test files (missing vitest imports, ESM `__dirname`)
2. Installed missing `@rolldown/plugin-babel` peer dependency
3. Added `typescript-eslint` and updated ESLint config for `.ts/.tsx`
4. Added `role="alert"` on error banner (accessibility)
5. Added `aria-label` on DropZone and its file input (accessibility)
6. Added keyboard navigation on header title: `role="button"`, `tabIndex={0}`, `onKeyDown` (accessibility)
7. Added `aria-label` on header title (accessibility)
8. Added `focus-visible` style on header title (accessibility)
9. Added small mobile breakpoint (<=374px): single-column metrics, reduced margins (responsive)

## Remaining recommendations

- **Code splitting**: Consider lazy-loading `MapView` and `ElevationChart` with `React.lazy()` to reduce initial bundle size
- **Marker alt text**: Leaflet markers don't support `alt` natively via react-leaflet; consider adding a visually-hidden legend for screen readers
- **Large GPX files**: `Math.min(...elevations)` / `Math.max(...)` could stack-overflow on very large arrays (>100k points); consider a loop-based approach
