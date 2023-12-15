import { EventEmitter } from 'events';
import jspb from 'google-protobuf';
import 'nrp-jsproto/dump_msgs_pb';  //missing compilation for wrappers etc.

import MqttClientService from '../../services/mqtt-client-service';
import DialogService from '../../services/dialog-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling the state of the experiment workbench and the current running simulation
 */
class DataVisualizerService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this._plotComponentX = 0;
    this._subTokenX = undefined;
    this._plotComponentY = 0;
    this._subTokenY = undefined;
    this._currentDataX = [0,0,0,0,0,0];
    this._currentDataY = [0,0,0,0,0,0];
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  //Todo: It's awkward treating X and Y data seperately. These should be merged
  get plotComponentX() {
    return this._plotComponentX;
  }
  set plotComponentX(topic) {
    console.info('PlotComponentX:');
    console.info(topic);
    this._subTokenX && MqttClientService.instance.unsubscribe(this._subTokenX);
    this._plotComponentX = topic;
    this._subTokenX = MqttClientService.instance.subscribeToTopic(DataVisualizerService.instance.plotComponentX,
      (data) => {
        console.info('PLOT COMPONENT');
        this._currentDataX = data;
        console.info(this._currentDataX);
      });
  }

  get plotComponentY() {
    return this._plotComponentY;
  }
  set plotComponentY(topic) {
    console.info('PlotComponentY:');
    console.info(topic);
    this._subTokenY && MqttClientService.instance.unsubscribe(this._subTokenY);
    this._plotComponentY = topic;
    this._subTokenY = MqttClientService.instance.subscribeToTopic(DataVisualizerService.instance.plotComponentY,
      (data) => {
        console.info('PLOT COMPONENT');
        this._currentDataY = data;
        console.info(this._currentDataY);
      });
  }

  get currentDataX() {
    return this._currentDataX;
  }

  get currentDataY() {
    return this._currentDataY;
  }
}

export default DataVisualizerService;

DataVisualizerService.EVENTS = Object.freeze({
  PLOT_OPENED: 'PLOT_OPENED'
});
