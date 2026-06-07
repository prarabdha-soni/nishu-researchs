// The web app's data seam. All domain types, helpers, and seed/fallback data
// come from @nishu/shared, so the cockpit and the agent speak identical shapes.
// Live data arrives via ../api/useAgent; components fall back to these seeds
// when the API is unreachable.
export * from "@nishu/shared";
