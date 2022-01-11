import { EventEmitter } from 'events';


import UserSettingsService from '../../user/user-settings-service';
import DataVisualizerROSAdapter from './data-visualizer-rosadapter';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of data visualization operations, and transition between the adaptor and the component
 * It communicates with the user settings and the simulation service and has parameter:
 * - key: HTML component of data visualizer ('plotid')
 */
class DataVisualizerService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this.key = '';
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

  async loadSortedSources(serverURL, simulationID) {
    await DataVisualizerROSAdapter.instance.getTopics(serverURL, simulationID);
  }

  sendSettings(settings) {
    this.settings = settings;
    this.emit(DataVisualizerService.EVENTS.SETTINGS, this.settings);
  }

  sendSortedSources(sortedSources) {
    this.emit(DataVisualizerService.EVENTS.SORTED_SOURCES, sortedSources);
  }

  sendStandardMessage(message, topics) {
    this.emit(DataVisualizerService.EVENTS.STANDARD_MESSAGE, { message, topics });
  }

  // ROS specific function
  sendStateMessage (message, topics) {
    this.emit(DataVisualizerService.EVENTS.STATE_MESSAGE, { message, topics });
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

  initializeConnection(plotStructure, serverConfig) {
    DataVisualizerROSAdapter.instance.getConnection(serverConfig);
    DataVisualizerROSAdapter.instance.subscribeTopics(plotStructure);
  }

  closeConnection() {
    DataVisualizerROSAdapter.instance.unsubscribeTopics();
  }
}

DataVisualizerService.EVENTS = Object.freeze({
  STANDARD_MESSAGE: 'STANDARD_MESSAGE',
  STATE_MESSAGE:  'STATE_MESSAGE',
  SETTINGS: 'SETTINGS',
  SORTED_SOURCES: 'SORTED_SOURCES'
});

export default DataVisualizerService;