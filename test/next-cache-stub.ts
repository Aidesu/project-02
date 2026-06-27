// Stub used by vitest to replace `next/cache` in tests. Cache Components is a
// build-time flag (off under vitest), so `cacheTag`/`cacheLife`/`updateTag`
// would throw if called for real. The catalog selectors call these through
// `loadAll`; here they are harmless no-ops (args ignored), leaving the pure
// sort/filter logic under test.
export function cacheTag(): void {}
export function cacheLife(): void {}
export function updateTag(): void {}
export function revalidateTag(): void {}
export function revalidatePath(): void {}
