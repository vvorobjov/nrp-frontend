const EXPERIMENT_STATE = {
  CREATED: 'created',
  STARTED: 'started',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped',
  UNDEFINED: '---/---'
};

const EXPERIMENT_FINAL_STATE = [
  EXPERIMENT_STATE.STOPPED,
  EXPERIMENT_STATE.FAILED,
  EXPERIMENT_STATE.UNDEFINED
];

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

module.exports = { EXPERIMENT_STATE, EXPERIMENT_RIGHTS, EXPERIMENT_FINAL_STATE };
module.exports = { EXPERIMENT_STATE, EXPERIMENT_RIGHTS, EXPERIMENT_FINAL_STATE };