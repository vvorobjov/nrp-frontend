const EXPERIMENT_STATE = {
  CREATED: 'created',
  STARTED: 'started',
  PAUSED: 'paused',
  INITIALIZED: 'initialized',
  COMPLETED: 'completed',
  HALTED: 'halted',
  FAILED: 'failed',
  STOPPED: 'stopped'
};

const EXPERIMENT_RIGHTS = {
  PUBLICLY_SHARED: {
    launch: false,
    delete: false,
    clone: true,
    share: false
  },
  OWNED: {
    launch: true,
    delete: true,
    clone: true,
    share: true
  }
};

module.exports = { EXPERIMENT_STATE, EXPERIMENT_RIGHTS };