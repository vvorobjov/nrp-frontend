import { EventEmitter } from 'events';


import UserSettingsService from '../../user/user-settings-service';
import DataVisualizerROSAdapter from './data-visualizer-rosadapter';
import SimulationService from '../execution/running-simulation-service';
import ServerResourcesService from '../execution/server-resources-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of data visualization operations and transition between the adaptor and the component
 */
class DataVisualizerService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
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

  async loadTopics(serverURL) {
    await DataVisualizerROSAdapter.instance.getTopics(serverURL);
  }

  sendSettings(settings) {
    this.settings = settings;
    this.emit(DataVisualizerService.EVENTS.SETTINGS, this.settings);
  }

  sendSortedSources(sortedSources) {
    this.emit(DataVisualizerService.EVENTS.SORTED_SOURCES, sortedSources);
  }

  // ROS specific function
  sendMessageAndTopics (message, topics) {
    this.emit(DataVisualizerService.EVENTS.MESSAGE_AND_TOPICS, {message, topics});
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

  unregisterPlot(keyContext) {
    if (this.key !== keyContext) {
      UserSettingsService.instance.saveSettings(this.settings);
    }
  }

  initializeConnection(plotStructure, simulationId) {
    let server = ServerResourcesService.instance.getServerConfig(simulationId);
    //BUILD PARALLEL BRANCH HERE WITH DIFFERENT ADAPTER
    //Parameters: plotStructure, server, adapter
    if (this.adapter.name === 'ROS') {
      this.connection = DataVisualizerROSAdapter.instance.getOrCreateConnection(server);
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
  MESSAGE_AND_TOPICS:  'MESSAGE_AND_TOPICS',
  SETTINGS: 'SETTINGS',
  SORTED_SOURCES: 'SORTED_SOURCES'
});

export default DataVisualizerService;