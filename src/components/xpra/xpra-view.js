import React from 'react';
import OndemandVideoIcon from '@material-ui/icons/OndemandVideo';

import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';
import { SIM_TOOL } from '../constants';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';

import './xpra-view.css';

export default class XpraView extends React.Component {
  constructor() {
    super();

    this.state = {
      xpraUrls: ExperimentWorkbenchService.instance.xpraUrls,
      currentUrl: undefined
    };
    if (this.state.xpraUrls.length > 0) {
      this.state.currentUrl = this.state.xpraUrls[0];
    }

    ExperimentWorkbenchService.instance.on(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      (status) => {
        this.simulationState = status.state;
        if (status.state === EXPERIMENT_STATE.PAUSED || status.state === EXPERIMENT_STATE.STARTED) {
          if (ExperimentWorkbenchService.instance.xpraUrls.length > 0) {
            this.setState({
              xpraUrls: ExperimentWorkbenchService.instance.xpraUrls,
              currentUrl: ExperimentWorkbenchService.instance.xpraUrls[0]
            });
          }
        }
      }
    );
  }

  onChangeSelectedXpraUrl(event) {
    this.setState({
      currentUrl: event.target.value
    });
  }

  render() {
    return (
      <div className='xpra-view-wrapper'>
        {this.state.currentUrl ?
          <div style={{height: '100%'}}>
            <div className='xpra-url-selector-header'>
              <div>Streaming Engine:</div>
              <select
                className='xpra-url-dropdown-selector'
                name="selectXpraUrl"
                value={this.state.currentUrl}
                onChange={(event) => this.onChangeSelectedXpraUrl(event)}>
                {this.state.xpraUrls.map(url => {
                  return (<option key={url} value={url}>{url}</option>);
                })}
              </select>
            </div>
            <iframe src={this.state.currentUrl + '?printing=No&file_transfer=No&floating_menu=No&sound=No'}
              title='Xpra' />
          </div>
          :
          <div className='note-no-streams'>No streams available, maybe no simulation has been started yet?</div>
        }
      </div>
    );
  }
}

XpraView.CONSTANTS = Object.freeze({
  TOOL_CONFIG: {
    singleton: true,
    type: SIM_TOOL.TOOL_TYPE.FLEXLAYOUT_TAB,
    flexlayoutNode: {
      'name': 'Server Videostream (Xpra)',
      'component': 'xpra'
    },
    flexlayoutFactoryCb: () =>  {
      return <XpraView />;
    },
    getIcon: () => {
      return <OndemandVideoIcon />;
    },
    isShown: () => {
      if (!ExperimentWorkbenchService.instance.experimentInfo) {
        return false;
      }

      // this is not really clean to parse the engine configs here in the frontend,
      // but necessary until the proxy can provide information with the experiment config / simulation start
      const engineConfigs = ExperimentWorkbenchService.instance.experimentInfo.configuration.EngineConfigs;
      let show = false;
      for (let config of engineConfigs) {
        if (config.EngineProcCmd && config.EngineProcCmd.includes('/usr/xpra-entrypoint.sh')) {
          show = true;
        }
      }

      return show;
    },
    isDisabled: () => {
      const xpraUrls = ExperimentWorkbenchService.instance.xpraUrls;
      if (!xpraUrls || xpraUrls.length === 0) {
        return true;
      }
      else  {
        return false;
      }
    }
  }
});
