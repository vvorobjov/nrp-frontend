import Plotly from 'plotly.js';
import { EventEmitter } from 'events';


import UserSettingsService from '../../user/user-settings-service';
import ExperimentExecutionService from '../execution/experiment-execution-service';
import DataVisualizerROSAdapter from './data-visualizer-rosadapter';
import SimulationService from '../execution/running-simulation-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of data visualization operations and transition between the adaptor and the component
 */
class DataVisualizerService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use' + this.constructor.name + '.instance');
    }
    this.container = {};
    this.key = '';
    this.adapter = 'ROS';
    this.plotly = true;
    this.plotlyConfig = {};
    this.connection = undefined;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  setKey(keyContext) {
    this.key = keyContext;
  }

  async getSimulationState(serverURL, simulationID) {
    return await SimulationService.instance.getState(serverURL, simulationID);
  }

  loadTopics(serverURL, simulationID) {
    DataVisualizerROSAdapter.instance.getTopics(serverURL, simulationID);
  }

  sendSettings(settings) {
    this.settings = settings;
    this.emit(DataVisualizerService.EVENTS.SETTINGS, this.settings);
  }

  sendSortedSources(sortedSources) {
    this.emit(DataVisualizerService.EVENTS.SORTED_SOURCES, sortedSources);
  }

  // ROS specific function
  sendStateMessage (message, topics) {
    this.emit(DataVisualizerService.EVENTS.STATE_MESSAGE, {message, topics});
  }

  sendStandardMessage (message) {
    this.emit(DataVisualizerService.EVENTS.STANDARD_MESSAGE, message);
  }

  saveSettings(keyContext, isStructure, isPlot, axisLabels, plotModel, plotStructure) {
    this.setKey(keyContext);
    if (!this.settings.plottingToolsData) {
      this.settings.plottingToolsData = {};
    }
    this.settings.isStructure = isStructure;
    this.settings.isPlot = isPlot;
    this.settings.axisLabels = axisLabels;
    this.settings.plotModel = plotModel;
    this.settings.plotStructure = plotStructure;
    UserSettingsService.instance.saveSettings(this.settings);
  }

  async unregisterPlot(keyContext) {
    Plotly.relayout(this.container, {
      width: this.checkSize(this.container.clientWidth),
      height: this.checkSize(this.container.clientHeight)
    });
    if (this.key !== keyContext) {
      this.saveSettings();
      return [this.container.offsetWidth, this.container.offsetHeight].join('x');
    }
  }

  buildPlotly(container, data, layout) {
    if (this.plotly) {
      return Plotly.react(container, data, layout, this.plotlyConfig);
    }
    return Plotly.plot(container, data, layout, this.plotlyConfig);
  }

  initializeConnection(plotStructure) {
    let server = ExperimentExecutionService.instance.getServerConfig()[1];
    //BUILD PARALLEL BRANCH HERE WITH DIFFERENT ADAPTER
    //Parameters: plotStructure, server, adapter
    if (this.adapter.name === 'ROS') {
      this.connection = DataVisualizerROSAdapter.instance.getOrCreateConnectionTo(server);
      DataVisualizerROSAdapter.instance.subscribeTopics(plotStructure);
    }
  }

  closeConnection() {
    if (this.adapter.name === 'ROS') {
      DataVisualizerROSAdapter.instance.unsubscribeTopics();
    }
  }
}

DataVisualizerService.EVENTS = Object.freeze({
  STANDARD_MESSAGE: 'STANDARD_MESSAGE',
  STATE_MESSAGE: 'STATE_MESSAGE',
  SETTINGS: 'SETTINGS',
  SORTED_SOURCES: 'SORTED_SOURCES'
});

export default DataVisualizerService;