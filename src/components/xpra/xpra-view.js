import React from 'react';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';

import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';
import { SIM_TOOL } from '../constants';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';

import './xpra-view.css';

export default class XpraView extends React.Component {
  constructor() {
    super();

    this.state = {
      xpraUrls: ExperimentWorkbenchService.instance.xpraUrls,
      currentUrl: undefined,
      // A dead stream renders as a blank frame, so track load progress and
      // failures explicitly to show a loading state and an error/retry
      // fallback instead of an empty iframe.
      iframeLoading: true,
      iframeError: false,
      iframeKey: 0
    };
    if (this.state.xpraUrls.length > 0) {
      this.state.currentUrl = this.state.xpraUrls[0];
    }
  }

  componentDidMount() {
    ExperimentWorkbenchService.instance.addListener(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      this.onSimulationStatusUpdated
    );
    if (this.state.currentUrl) {
      this.startIframeLoadTimeout();
    }
  }

  componentWillUnmount() {
    // Remove the status listener so the service does not call setState on an
    // unmounted component (memory leak + React warning).
    ExperimentWorkbenchService.instance.removeListener(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      this.onSimulationStatusUpdated
    );
    this.clearIframeLoadTimeout();
  }

  /**
   * A cross-origin stream that never loads fires no `onError`, so fall back to
   * a timeout: if the iframe has not loaded in time, treat it as a failure.
   */
  startIframeLoadTimeout() {
    this.clearIframeLoadTimeout();
    this.iframeLoadTimeout = setTimeout(() => {
      if (this.state.iframeLoading) {
        this.setState({ iframeLoading: false, iframeError: true });
      }
    }, XpraView.CONSTANTS.LOAD_TIMEOUT_MS);
  }

  clearIframeLoadTimeout() {
    if (this.iframeLoadTimeout) {
      clearTimeout(this.iframeLoadTimeout);
      this.iframeLoadTimeout = undefined;
    }
  }

  onIframeLoad = () => {
    this.clearIframeLoadTimeout();
    this.setState({ iframeLoading: false, iframeError: false });
  };

  onIframeError = () => {
    this.clearIframeLoadTimeout();
    this.setState({ iframeLoading: false, iframeError: true });
  };

  reloadIframe = () => {
    // Bump the key to force a fresh iframe element and restart the watchdog.
    this.setState(
      (state) => ({ iframeKey: state.iframeKey + 1, iframeLoading: true, iframeError: false }),
      () => this.startIframeLoadTimeout()
    );
  };

  onSimulationStatusUpdated = (status) => {
    this.simulationState = status.state;
    if (status.state === EXPERIMENT_STATE.PAUSED || status.state === EXPERIMENT_STATE.STARTED) {
      if (ExperimentWorkbenchService.instance.xpraUrls.length > 0) {
        this.setState({
          xpraUrls: ExperimentWorkbenchService.instance.xpraUrls,
          currentUrl: ExperimentWorkbenchService.instance.xpraUrls[0],
          iframeLoading: true,
          iframeError: false
        }, () => this.startIframeLoadTimeout());
      }
    }
  }

  onChangeSelectedXpraUrl(event) {
    this.setState({
      currentUrl: event.target.value,
      iframeLoading: true,
      iframeError: false
    }, () => this.startIframeLoadTimeout());
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
            <div className='xpra-iframe-container'>
              {this.state.iframeError ?
                <div className='xpra-iframe-fallback'>
                  <div>The video stream could not be loaded (the stream may not be ready yet).</div>
                  <button className='xpra-iframe-retry' onClick={this.reloadIframe}>Retry</button>
                </div>
                :
                <React.Fragment>
                  {this.state.iframeLoading &&
                    <div className='xpra-iframe-loading'>Loading stream…</div>
                  }
                  <iframe key={this.state.iframeKey}
                    src={this.state.currentUrl + '?printing=No&file_transfer=No&floating_menu=No&sound=No'}
                    title='Xpra'
                    onLoad={this.onIframeLoad}
                    onError={this.onIframeError} />
                </React.Fragment>
              }
            </div>
          </div>
          :
          <div className='note-no-streams'>No streams available, maybe no simulation has been started yet?</div>
        }
      </div>
    );
  }
}

XpraView.CONSTANTS = Object.freeze({
  // How long to wait for the stream iframe to load before showing the
  // error/retry fallback.
  LOAD_TIMEOUT_MS: 15000,
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
