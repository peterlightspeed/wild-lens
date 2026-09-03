/* ==========================================================================
   WildLens — runtime config
   Point this at your deployed backend once you stand it up (see backend/README.md).
   Leaving it unreachable is fine — every gated action fails gracefully with
   a toast instead of crashing, and guest-accessible features (identify,
   browsing) don't need the API at all in demo mode.
   ========================================================================== */
window.WL_CONFIG = {
  API_BASE: 'http://localhost:8000/api'
};
