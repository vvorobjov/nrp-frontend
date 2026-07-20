// Tab indices for the experiments-overview tabs. Kept in a standalone module so
// leaf components (e.g. experiment-list-element) can reference them without
// statically importing the heavy ExperimentsOverview component — that static
// import would otherwise pin the whole overview subtree into the main bundle and
// defeat the route-level code splitting in App.js.
export const TAB_INDEX = Object.freeze({
  MY_EXPERIMENTS: 0,
  NEW_EXPERIMENT: 1,
  MODEL_LIBRARIES: 2,
  EXPERIMENT_FILES: 3,
  TEMPLATES: 4,
  RUNNING_SIMULATIONS: 5
});
