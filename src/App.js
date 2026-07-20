import React, { Suspense, lazy } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { withCookies } from 'react-cookie';
import Spinner from 'react-bootstrap/Spinner';

import EntryPage from './components/entry-page/entry-page';
import ErrorBoundary from './components/error-boundary/error-boundary';
import ErrorDialog from './components/dialog/error-dialog.js';
import NotificationDialog from './components/dialog/notification-dialog.js';
import MqttClientService from './services/mqtt-client-service';

// Route-level code splitting. The experiments overview and the (heavy)
// experiment workbench — the latter pulls in flexlayout, the CodeMirror TF
// editor and the xpra viewer — are loaded on demand so they no longer inflate
// the initial bundle. The entry page stays eager as the default landing route.
const ExperimentsOverview = lazy(() => import('./components/experiments-overview/experiments-overview'));
const ExperimentWorkbench = lazy(() => import('./components/experiment-workbench/experiment-workbench'));
// import SimulationView from './components/simulation-view/simulation-view';

const RouteFallback = () => (
  <div
    className='route-loading'
    role='status'
    aria-live='polite'
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <Spinner animation='border' role='status' aria-hidden='true' />
    <span style={{ marginLeft: 12 }}>Loading…</span>
  </div>
);

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
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path='/experiments-overview' element={<ExperimentsOverview/>} />
                <Route path='/experiment/:experimentID' element={<ExperimentWorkbench/>} />
                {/* <Route path='/simulation-view/:serverIP/:simulationID' element={<SimulationView/>} /> */}
                {/* Catch-all keeps the v5 behaviour where the non-exact '/' route
                    rendered the entry page for the root and any unmatched path. */}
                <Route path='*' element={<EntryPage cookies={this.props.cookies}/>} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </div>
      </ErrorBoundary>
    );
  }
}

export default withCookies(App);
