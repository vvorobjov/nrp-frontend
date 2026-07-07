import React from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { withCookies } from 'react-cookie';

import EntryPage from './components/entry-page/entry-page';
import ErrorBoundary from './components/error-boundary/error-boundary';
import ErrorDialog from './components/dialog/error-dialog.js';
import ExperimentsOverview from './components/experiments-overview/experiments-overview';
import ExperimentWorkbench from './components/experiment-workbench/experiment-workbench';
// import SimulationView from './components/simulation-view/simulation-view';
import NotificationDialog from './components/dialog/notification-dialog.js';
import MqttClientService from './services/mqtt-client-service';

class App extends React.Component {

  componentDidMount() {
    this.mqttClientService = MqttClientService.instance;
  }

  render() {
    return (
      <ErrorBoundary>
        <div>
          <ErrorDialog />
          <NotificationDialog/>
          <BrowserRouter>
            <Routes>
              <Route path='/experiments-overview' element={<ExperimentsOverview/>} />
              <Route path='/experiment/:experimentID' element={<ExperimentWorkbench/>} />
              {/* <Route path='/simulation-view/:serverIP/:simulationID' element={<SimulationView/>} /> */}
              {/* Catch-all keeps the v5 behaviour where the non-exact '/' route
                  rendered the entry page for the root and any unmatched path. */}
              <Route path='*' element={<EntryPage cookies={this.props.cookies}/>} />
            </Routes>
          </BrowserRouter>
        </div>
      </ErrorBoundary>
    );
  }
}

export default withCookies(App);
