export class ExperimentConfiguration {
  constructor() {
    this.uuid = null;
    this.name = null;
    this.owned = false;
    this.joinableServers = [];
    this.id = null;
    this.private = null;
    this.configuration = {
      maturity: '',
      SimulationName: '',
      SimulationTimeout: ''
    };
  }
}
