import React from 'react';
import FlexLayout from 'flexlayout-react';

import { withCookies } from 'react-cookie';

import withRouter from '../../utility/with-router';
import ExperimentTools from './experiment-tools';
import ExperimentToolsService from './experiment-tools-service';
import ExperimentWorkbenchService from './experiment-workbench-service';
import ExperimentTimeBox from './experiment-time-box';
import SimulationService from '../../services/experiments/execution/running-simulation-service';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service';
import ServerResourcesService from '../../services/experiments/execution/server-resources-service.js';
import MqttClientService from '../../services/mqtt-client-service';
import DialogService from '../../services/dialog-service';
import { EXPERIMENT_STATE, EXPERIMENT_FINAL_STATE } from '../../services/experiments/experiment-constants';
import LeaveWorkbenchDialog from './leave-workbench-dialog';

import '../../../node_modules/flexlayout-react/style/light.css';
import './experiment-workbench.css';


import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import CircularProgress from '@mui/material/CircularProgress';

import packageInfo from '../../../package.json';
const { version } = packageInfo;

// Human-readable labels for each simulation lifecycle state, so the toolbar
// shows a clear status instead of the raw backend token.
const SIMULATION_STATE_LABELS = {
  [EXPERIMENT_STATE.CREATED]: 'Created',
  [EXPERIMENT_STATE.STARTED]: 'Running',
  [EXPERIMENT_STATE.PAUSED]: 'Paused',
  [EXPERIMENT_STATE.COMPLETED]: 'Completed',
  [EXPERIMENT_STATE.FAILED]: 'Failed',
  [EXPERIMENT_STATE.STOPPED]: 'Stopped',
  [EXPERIMENT_STATE.UNDEFINED]: 'Not started'
};

const jsonBaseLayout = {
  global: {},
  borders: [],
  layout:{
    'type': 'row',
    'weight': 100,
    'children': [
      {
        'type': 'tabset',
        'weight': 50,
        'id': 'defaultTabset',
        'selected': 0,
        'children': [
          {
            'type': 'tab',
            'name': 'Edit experiment files',
            'component': 'TransceiverFunctionEditor'
          }
        ]
      }
    ]
  }
};

// TODO: Unify styles with css or mui styles
const drawerWidth = 240;

// Stable class names applied to the workbench elements. The rules for each are
// declared on the `Root` styled component below (MUI v5 `styled`, replacing the
// removed deprecated JSS bridge). `styled` from @mui/material/styles resolves
// against MUI's full default theme, so no explicit ThemeProvider is needed for
// theme.mixins/zIndex/transitions/spacing/breakpoints.
const classes = {
  toolbar: 'ExpWb-toolbar',
  toolbarIcon: 'ExpWb-toolbarIcon',
  appBar: 'ExpWb-appBar',
  appBarShift: 'ExpWb-appBarShift',
  menuButton: 'ExpWb-menuButton',
  menuButtonHidden: 'ExpWb-menuButtonHidden',
  controlButton: 'ExpWb-controlButton',
  title: 'ExpWb-title',
  drawerPaper: 'ExpWb-drawerPaper',
  drawerPaperClose: 'ExpWb-drawerPaperClose',
  appBarSpacer: 'ExpWb-appBarSpacer',
  content: 'ExpWb-content',
  container: 'ExpWb-container',
  controlContainer: 'ExpWb-controlContainer',
  contentContainer: 'ExpWb-contentContainer'
};

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  [`& .${classes.toolbar}`]: {
    paddingRight: 24 // keep right padding when drawer closed
  },
  [`& .${classes.toolbarIcon}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar
  },
  [`& .${classes.appBar}`]: {
    position: 'absolute',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  [`& .${classes.appBarShift}`]: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  [`& .${classes.menuButton}`]: {
    marginRight: 36
  },
  [`& .${classes.menuButtonHidden}`]: {
    display: 'none'
  },
  [`& .${classes.controlButton}`]: {
    borderWidth: '0'
  },
  [`& .${classes.title}`]: {
    flexGrow: 1
  },
  [`& .${classes.drawerPaper}`]: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  [`& .${classes.drawerPaperClose}`]: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9)
    }
  },
  [`& .${classes.appBarSpacer}`]: theme.mixins.toolbar,
  [`& .${classes.content}`]: {
    position: 'relative',
    flexGrow: 1,
    height: '100vh',
    overflow: 'hidden'
  },
  [`& .${classes.container}`]: {
    position: 'relative',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(0),
    direction: 'column',
    display: 'flex'
  },
  [`& .${classes.controlContainer}`]: {
    height: 50,
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'row',
    flexBasis: 0,
    flexGrow: 1,
    alignItems: 'center'
  },
  // TODO: Fix vertical filling
  [`& .${classes.contentContainer}`]: {
    height: '80vh',
    padding: theme.spacing(1),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column'
  }
}));


class ExperimentWorkbench extends React.Component {
  constructor(props) {
    super(props);

    const {experimentID} = props.params;
    this.experimentID = experimentID;
    ExperimentWorkbenchService.instance.experimentID = this.experimentID;
    this.serverURL = ExperimentWorkbenchService.instance.serverURL;

    this.state = {
      modelFlexLayout: FlexLayout.Model.fromJson(jsonBaseLayout),
      showLeaveDialog: false,
      drawerOpen: false,
      notificationCount: 0,
      // TODO: take from some config
      nrpVersion: version,
      experimentConfiguration: {},
      runningSimulationID: undefined,
      simulationState: EXPERIMENT_STATE.UNDEFINED,
      simStateLoading: false,
      availableServers: [],
      mqttConnectionState: MqttClientService.instance.getConnectionState()
    };

    this.flexlayoutReference = React.createRef();
    this.state.modelFlexLayout.doAction(FlexLayout.Actions.setActiveTabset('defaultTabset'));
    ExperimentToolsService.instance.setFlexLayoutModel(this.state.modelFlexLayout);
  }

  async componentDidMount() {
    await ExperimentWorkbenchService.instance.initExperimentInformation(this.experimentID);
    this.updateLastExperiments();

    if (ExperimentWorkbenchService.instance.experimentInfo) {
      this.setState({experimentConfiguration: ExperimentWorkbenchService.instance.experimentInfo.configuration});
    }
    // Use a local: under React 18 automatic batching this setState is still
    // pending when the guard below runs, so reading this.state.runningSimulationID
    // there would see the stale undefined and skip the initial state fetch for an
    // already-running simulation (same stale-state anti-pattern as EBR2-122).
    let runningSimulationID;
    if (ExperimentWorkbenchService.instance.simulationInfo !== undefined) {
      runningSimulationID = ExperimentWorkbenchService.instance.simulationInfo.ID;
      this.setState({ runningSimulationID });
    }

    // Update simulation state, if it is defined
    if (runningSimulationID !== undefined) {
      await SimulationService.instance.getInfo(
        ExperimentWorkbenchService.instance.serverURL,
        runningSimulationID
      ).then((simInfo) => {
        simInfo && this.setState({ simulationState: simInfo.state});
      });
    }

    // subscribe to status changes
    ExperimentWorkbenchService.instance.addListener(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      this.updateSimulationStatus
    );

    // update the list of available servers
    this.setState({ availableServers: await ServerResourcesService.instance.getServerAvailability() });

    // subscribe to server availablility
    ServerResourcesService.instance.addListener(
      ServerResourcesService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    // Track the MQTT connection so the dashboard visibly stops looking "live"
    // when the broker drops (EBR2-108 connection-state API).
    this.setState({ mqttConnectionState: MqttClientService.instance.getConnectionState() });
    MqttClientService.instance.addListener(
      MqttClientService.EVENTS.CONNECTION_STATE_CHANGED,
      this.onMqttConnectionStateChanged
    );
  }

  updateLastExperiments(){
    const {cookies} = this.props;
    var experimentIDs = undefined;
    experimentIDs = cookies.get('experimentIDs');
    if (experimentIDs) {
      var isIn = false;
      var index = 0;
      experimentIDs.forEach((expID) =>{
        if (this.experimentID===expID) {
          index = experimentIDs.indexOf(expID);
          isIn = true;
        }
      });
      // ensure no duplicates
      if (isIn) {
        experimentIDs.splice(index, 1);
      }
      experimentIDs = [this.experimentID, ...experimentIDs];
      // limit to max 3 experimentIDs
      if (experimentIDs.length > 3) {
        experimentIDs = experimentIDs.slice(0, 3);
      }
    }
    else {
      experimentIDs = [this.experimentID];
    }
    cookies.set('experimentIDs', experimentIDs, { path: '/' });
  }

  async componentDidUpdate() {
  }

  async componentWillUnmount() {
    ExperimentWorkbenchService.instance.removeListener(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      this.updateSimulationStatus
    );
    ServerResourcesService.instance.removeListener(
      ServerResourcesService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );
    MqttClientService.instance.removeListener(
      MqttClientService.EVENTS.CONNECTION_STATE_CHANGED,
      this.onMqttConnectionStateChanged
    );
    // Remove the simulation when we leave the workbench
    ExperimentWorkbenchService.instance.simulationInfo = undefined;
  }

  /**
   * Sets the new available servers
   * @listens ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED
   * @param {Array.<Object>} availableServers list of available servers
   */
  onUpdateServerAvailability = (availableServers) => {
    this.setState({ availableServers: availableServers });
  };

  /**
   * Reflects the current MQTT broker connection state in the UI.
   * @listens MqttClientService.EVENTS.CONNECTION_STATE_CHANGED
   * @param {string} state one of MqttClientService.CONNECTION_STATES
   */
  onMqttConnectionStateChanged = (state) => {
    this.setState({ mqttConnectionState: state });
  };

  /**
   * @returns {string|undefined} a user-facing message when the broker is not
   * connected (and the dashboard is therefore not live), undefined otherwise.
   */
  getMqttConnectionBanner() {
    const STATES = MqttClientService.CONNECTION_STATES;
    switch (this.state.mqttConnectionState) {
    case STATES.CONNECTED:
      return undefined;
    case STATES.RECONNECTING:
      return 'Connection to the simulation broker lost — reconnecting…';
    case STATES.OFFLINE:
      return 'The simulation broker is offline — the dashboard is not live.';
    case STATES.ERROR:
      return 'Connection error with the simulation broker — the dashboard is not live.';
    default:
      return 'Disconnected from the simulation broker — the dashboard is not live.';
    }
  }

  /**
   * Sets the new simulation status to the component state
   * @listens ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED
   * @param {EXPERIMENT_STATE} status is a new simulation state
   */
  updateSimulationStatus = async (status) => {
    if (Object.values(EXPERIMENT_STATE).indexOf(status.state) > -1) {
      // Update the STOPPED state only from the request
      if (status.state !== EXPERIMENT_STATE.STOPPED) {
        // update only new states
        if (status.state !== this.state.simulationState) {
          this.setState({ simStateLoading: false });
          this.setState({ simulationState: status.state });
          DialogService.instance.progressNotification({
            message: 'The experiment is ' + this.state.simulationState
          });
          // clear simulationInfo for the finilized experiments
          if (EXPERIMENT_FINAL_STATE.includes(this.state.simulationState)) {
            ExperimentWorkbenchService.instance.simulationInfo = undefined;
            this.setState({ runningSimulationID: undefined });
          }
        }
      }
    }
    else {
      DialogService.instance.simulationError({
        message: 'Received unknown simulation state: ' + status.state.toString()
      });
    }
  }

  async onButtonInitialize() {
    if (this.state.availableServers.length === 0) {
      DialogService.instance.warningNotification({
        message: 'No servers are available.'
      });
      return;
    }
    if (!ExperimentWorkbenchService.instance.mqttConnected()) {
      DialogService.instance.warningNotification({
        message: 'The MQTT broker is not connected. The simulation cannot be initialized.'
      });
      return;
    }
    // if there is no simulation bound
    if (this.state.runningSimulationID === undefined) {
      // Give immediate feedback for the (potentially long) launch: keep the
      // toolbar disabled and show the launching spinner until the simulation
      // reports its first status over MQTT.
      this.setState({ simulationState: undefined, simStateLoading: true });
      await ExperimentExecutionService.instance.startNewExperiment(
        ExperimentWorkbenchService.instance.experimentInfo
      ).then(async (simResponse) => {
        if (typeof simResponse === 'undefined') {
          // Nothing was launched: stop the spinner and reflect the failure
          // instead of leaving the toolbar spinning forever.
          this.setState({ simStateLoading: false, simulationState: EXPERIMENT_STATE.FAILED });
          console.error('startNewExperiment() returned with simResponse === undefined');
          return;
        }

        const simInfo = await simResponse.simulation.json();
        // TODO: get proper simulation information
        if (simInfo) {
          ExperimentWorkbenchService.instance.simulationInfo = {
            ID: simInfo.simulationID,
            MQTTPrefix: simInfo.MQTTPrefix
          };
          this.setState({ runningSimulationID: simInfo.simulationID });
          // Keep simStateLoading true: the real state now comes from MQTT.
        }
        else {
          throw new Error('Could not parse the response from the backend after initializing the simulation');
        }
        ExperimentWorkbenchService.instance.serverURL = simResponse['serverURL'];
        this.serverURL = simResponse['serverURL'];
      }).catch((failure) => {
        // A failed launch must clear the spinner and surface the error.
        this.setState({ simStateLoading: false, simulationState: EXPERIMENT_STATE.FAILED });
        DialogService.instance.simulationError({ message: failure });
      });
    }
    else {
      // TODO: allow Initializing multiple simulations
      DialogService.instance.warningNotification({
        message: 'There is the simulation already Initialized.'
      });
    }
  }

  async onButtonStart() {
    // On START button click, start simulation if it was created
    let newState = EXPERIMENT_STATE.STARTED;

    this.setSimulationState(newState);
  }

  async onButtonPause() {
    let newState = EXPERIMENT_STATE.PAUSED;

    this.setSimulationState(newState);
  }

  async onButtonShutdown() {
    let newState = EXPERIMENT_STATE.STOPPED;

    await this.setSimulationState(newState).then(() => {
      if (this.state.simulationState === EXPERIMENT_STATE.STOPPED) {
        this.setState({ runningSimulationID: undefined });
        ExperimentWorkbenchService.instance.simulationInfo = undefined;
      }
    });
  }

  async setSimulationState(newState) {
    if (this.state.runningSimulationID !== undefined) {
      this.setState({ simStateLoading: true });
      try {
        const simInfo = await SimulationService.instance.updateState(
          ExperimentWorkbenchService.instance.serverURL,
          this.state.runningSimulationID,
          newState
        );
        console.debug('New simulation state is set: ' + simInfo.state);
        // Set STOPPED state by response (the other by MQTT)
        if (simInfo.state === EXPERIMENT_STATE.STOPPED) {
          this.setState({ simulationState: simInfo.state });
          // clear simulationInfo for the finilized experiments
          ExperimentWorkbenchService.instance.simulationInfo = undefined;
          this.setState({ runningSimulationID: undefined });
        }
      }
      catch (error) {
        // A failed START/PAUSE/STOP must not leave the toolbar frozen with the
        // spinner on and every control disabled forever: reflect a failed state
        // and surface the error instead of a silent, permanent lockout.
        this.setState({ simulationState: EXPERIMENT_STATE.FAILED });
        DialogService.instance.simulationError({
          message: 'Could not change the simulation state to "' + newState + '".',
          data: error && error.toString()
        });
      }
      finally {
        // Always clear the loading flag so the toolbar becomes interactive again.
        this.setState({ simStateLoading: false });
      }
    }
  }

  onButtonLayout() {
    console.info(this.state.modelFlexLayout.toJson());
  }

  showLeaveDialog(show) {
    this.setState({showLeaveDialog: show});
  }

  leaveWorkbench() {
    this.props.navigate('/experiments-overview');
  }

  getStatusStyle() {
    switch (this.state.simulationState) {
    case EXPERIMENT_STATE.STARTED:
      return 'simulation-status-started';
    case EXPERIMENT_STATE.PAUSED:
      return 'simulation-status-paused';
    case EXPERIMENT_STATE.COMPLETED:
      return 'simulation-status-completed';
    case EXPERIMENT_STATE.FAILED:
      return 'simulation-status-error';
    case EXPERIMENT_STATE.CREATED:
    case EXPERIMENT_STATE.STOPPED:
      return 'simulation-status-stopped';
    default:
      return 'simulation-status-default';
    }
  }

  /**
   * Human-readable label for the current simulation lifecycle state.
   * @returns {string} the label to display next to "Simulation State".
   */
  getStatusLabel() {
    const state = this.state.simulationState;
    if (this.state.simStateLoading && (state === undefined || state === EXPERIMENT_STATE.UNDEFINED)) {
      return 'Launching…';
    }
    if (state === undefined) {
      return 'Not started';
    }
    return SIMULATION_STATE_LABELS[state] || state;
  }

  render() {
    return (
      <Root>
        <CssBaseline />
        <AppBar position='absolute' className={clsx(classes.appBar, this.state.drawerOpen && classes.appBarShift)}>
          <Toolbar className={classes.toolbar}>
            <IconButton
              edge='start'
              color='inherit'
              aria-label='open drawer'
              onClick={() => this.setState({ drawerOpen: true })}
              className={clsx(classes.menuButton, this.state.drawerOpen && classes.menuButtonHidden)}
              size="large">
              <MenuIcon />
            </IconButton>
            {/* Initialize button*/}
            <IconButton
              color={
                this.state.availableServers.length && ExperimentWorkbenchService.instance.mqttConnected()
                  ? 'inherit'
                  : 'default'
              }
              className={classes.controlButton}
              onClick={() => this.onButtonInitialize()}
              disabled={
                this.state.showLeaveDialog ||
                this.state.runningSimulationID !== undefined ||
                !EXPERIMENT_FINAL_STATE.includes(this.state.simulationState) ||
                this.state.simStateLoading
              }
              title={
                this.state.availableServers.length === 0 ?
                  'No servers available' :
                  'Initialize experiment'
              }
              size="large">
              <FlightTakeoffIcon />
            </IconButton>
            {/* Play/pause button*/}
            {this.state.simulationState === EXPERIMENT_STATE.STARTED
              ?
              <IconButton
                color='inherit'
                onClick={() => this.onButtonPause()}
                disabled={
                  this.state.showLeaveDialog ||
                  this.state.simulationState !== EXPERIMENT_STATE.STARTED ||
                  this.state.simStateLoading
                }
                title='Pause'
                size="large">
                <PauseIcon />
              </IconButton>
              :
              <IconButton
                color='inherit'
                onClick={() => this.onButtonStart()}
                disabled={
                  this.state.showLeaveDialog ||
                  this.state.runningSimulationID === undefined ||
                  this.state.simulationState !== EXPERIMENT_STATE.PAUSED ||
                  this.state.simStateLoading
                }
                title='Start'
                size="large">
                <PlayCircleFilledWhiteIcon />
              </IconButton>
            }
            {/* Shutdown button*/}
            <IconButton
              color='inherit'
              className={classes.controlButton}
              onClick={() => this.onButtonShutdown()}
              disabled={
                this.state.showLeaveDialog ||
                EXPERIMENT_FINAL_STATE.includes(this.state.simulationState) ||
                this.state.simulationState === undefined ||
                this.state.simStateLoading
              }
              title='Shutdown experiment'
              size="large">
              <StopIcon />
            </IconButton>
            {/* Exit button */}
            <IconButton
              color='inherit'
              onClick={() => this.setState({ showLeaveDialog: true })}
              title='Leave experiment'
              size="large">
              <ExitToAppIcon />
            </IconButton>
            {/* Title */}
            <Typography align='center' component='h1' variant='h6' color='inherit' noWrap className={classes.title}>
              <span>
                {this.state.experimentConfiguration.SimulationName}
                {this.state.runningSimulationID !== undefined ?
                  ': simulation ' + this.state.runningSimulationID.toString() :
                  null
                }
              </span>
            </Typography>
            {/* TODO: Add error popup and notification counter */}
            {/* Notification counter */}
            {/* <IconButton color='inherit'>
              <Badge badgeContent={this.state.notificationCount} color='secondary'>
                <NotificationsIcon />
              </Badge>
            </IconButton> */}
          </Toolbar>
        </AppBar>
        <Drawer
          variant='permanent'
          classes={{
            paper: clsx(classes.drawerPaper, !this.state.drawerOpen && classes.drawerPaperClose)
          }}
          open={this.state.drawerOpen}>
          <div className={classes.toolbarIcon}>
            <Typography align='left' component='h1' variant='h6' color='inherit' noWrap className={classes.title}>
              NRP {this.state.nrpVersion}
            </Typography>
            <IconButton onClick={() => this.setState({ drawerOpen: false })} size="large">
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <ExperimentTools flexlayoutReference={this.flexlayoutReference} />
        </Drawer>
        {/* This is the leaving dialog */}
        <LeaveWorkbenchDialog visible={this.state.showLeaveDialog}
          setVisibility={(visible) => this.showLeaveDialog(visible)}
          shutdownDisabled={
            EXPERIMENT_FINAL_STATE.includes(this.state.simulationState) ||
            this.state.simulationState === undefined ||
            this.state.simStateLoading
          }
          shutdownSimulation={async () => {
            await this.onButtonShutdown();
            this.leaveWorkbench();
          }}
          leaveWorkbench={() => {
            this.leaveWorkbench();
          }}
        />
        {/* This is the content of the main window */}
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          {this.getMqttConnectionBanner() &&
            <div className={clsx('mqtt-connection-banner',
              this.state.mqttConnectionState === MqttClientService.CONNECTION_STATES.RECONNECTING
                ? 'mqtt-connection-banner-reconnecting'
                : 'mqtt-connection-banner-offline')}
            role='alert'>
              {this.state.mqttConnectionState === MqttClientService.CONNECTION_STATES.RECONNECTING &&
                <CircularProgress size='1rem' color='inherit' style={{ marginRight: 8, verticalAlign: 'middle' }} />
              }
              {this.getMqttConnectionBanner()}
            </div>
          }
          <Grid container spacing={1} className={classes.container}>
            {/* Chart */}
            <Grid item xs={12}>
              <Paper className={clsx(classes.controlContainer, this.getStatusStyle())}>
                <ExperimentTimeBox value='real'/>
                <ExperimentTimeBox value='experiment'/>
                <ExperimentTimeBox value='remaining'/>
                <Typography align='left' variant='subtitle1' color='inherit' noWrap className={classes.title}>
                  Simulation State: {this.getStatusLabel()}
                  {this.state.simStateLoading &&
                    <CircularProgress size='1rem' style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                  }
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper className={classes.contentContainer}>
                <FlexLayout.Layout ref={this.flexlayoutReference} model={this.state.modelFlexLayout}
                  factory={(node) => {
                    return ExperimentToolsService.instance.flexlayoutNodeFactory(node);
                  }} />
              </Paper>
            </Grid>
          </Grid>
        </main>
      </Root>
    );
  }

}

export default withRouter(withCookies(ExperimentWorkbench));

ExperimentWorkbench.CONSTANTS = Object.freeze({
  INTERVAL_INTERNAL_UPDATE_MS: 1000
});
