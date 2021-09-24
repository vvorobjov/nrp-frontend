import Plotly from 'plotly.js';

import ExperimentExecutionService from '../execution/experiment-execution-service';
import DataVisualizerROSAdapter from './data-visualizer-rosadapter';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of data visualization operations and transition between the adaptor and the component
 */
export default class DataVisualizerService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerService(SINGLETON_ENFORCER);
    }

    return this.instance;
  }

  getModel() {
    return;
  }

  async unregisterPlot() {
    Plotly.relayout(this.state.container, {
      width: this.checkSize(this.state.container.clientWidth),
      height: this.checkSize(this.state.container.clientHeight)
    });
    if (this.state.uniqueKey !== this.state.contextualUniqueKey) {
      this.saveSettings();
      return [this.state.container.offsetWidth, this.state.container.offsetHeight].join('x');
    }
  }

  buildPlotly(container, data, layout) {
    if (this.state.plotly) {
      return Plotly.react(container, data, layout, this.state.plotlyConfig);
    }
    return Plotly.plot(container, data, layout, this.state.plotlyConfig);
  }

  initializeConnection(plotStructure) {
    let server = ExperimentExecutionService.instance.getServerConfig()[1];
    //BUILD PARALLEL BRANCH HERE WITH DIFFERENT ADPATER
    //Parameters: plotStructure, server, adapter
    if (this.state.adapter.name === 'ROS') {
      this.setState({ connection: DataVisualizerROSAdapter.instance.getOrCreateConnectionTo(server) });
      DataVisualizerROSAdapter.instance.subscribeTopics(plotStructure);
    }
  }

  closeConnection() {
    DataVisualizerROSAdapter.instance.unsubscribeTopics();
  }
}