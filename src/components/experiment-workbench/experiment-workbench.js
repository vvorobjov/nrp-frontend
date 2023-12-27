import React from 'react';
import FlexLayout from 'flexlayout-react';

import { withCookies } from 'react-cookie';

import ExperimentTools from './experiment-tools';
import ExperimentToolsService from './experiment-tools-service';
import ExperimentWorkbenchService from './experiment-workbench-service';
import ExperimentTimeBox from './experiment-time-box';
import SimulationService from '../../services/experiments/execution/running-simulation-service';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service';
import ServerResourcesService from '../../services/experiments/execution/server-resources-service.js';
import DialogService from '../../services/dialog-service';
import { EXPERIMENT_STATE, EXPERIMENT_FINAL_STATE } from '../../services/experiments/experiment-constants';
import LeaveWorkbenchDialog from './leave-workbench-dialog';

import '../../../node_modules/flexlayout-react/style/light.css';
import './experiment-workbench.css';


import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import MenuIcon from '@material-ui/icons/Menu';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';
import FlightTakeoffIcon from '@material-ui/icons/FlightTakeoff';

import CircularProgress from '@material-ui/core/CircularProgress';

const { version } = require('../../../package.json');

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
const useStyles = theme => ({
  root: {
    display: 'flex'
  },
  toolbar: {
    paddingRight: 24 // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar
  },
  appBar: {
    position: 'absolute',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  menuButton: {
    marginRight: 36
  },
  menuButtonHidden: {
    display: 'none'
  },
  controlButton: {
    borderWidth: '0',
    shape: {
      borderRadius: 0
    }
  },
  title: {
    flexGrow: 1
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerPaperClose: {
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
  appBarSpacer: theme.mixins.toolbar,
  content: {
    position: 'relative',
    flexGrow: 1,
    height: '100vh',
    overflow: 'hidden'
  },
  container: {
    position: 'relative',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(0),
    direction: 'column',
    display: 'flex'
  },
  controlContainer: {
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
  contentContainer: {
    height: '80vh',
    padding: theme.spacing(1),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column'
  }
});


class ExperimentWorkbench extends React.Component {
  constructor(props) {
    super(props);

    const {experimentID} = props.match.params;
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
      availableServers: []
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
    if (ExperimentWorkbenchService.instance.simulationInfo !== undefined) {
      this.setState({ runningSimulationID: ExperimentWorkbenchService.instance.simulationInfo.ID });
    }

    // Update simulation state, if it is defined
    if (this.state.runningSimulationID !== undefined) {
      await SimulationService.instance.getInfo(
        ExperimentWorkbenchService.instance.serverURL,
        this.state.runningSimulationID
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
      this.setState({ simulationState: undefined });
      await ExperimentExecutionService.instance.startNewExperiment(
        ExperimentWorkbenchService.instance.experimentInfo
      ).then(async (simResponse) => {
        if (typeof simResponse === 'undefined') {
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
          // get the simulationState from MQTT only
          this.setState({ simStateLoading: true });
        }
        else {
          throw new Error('Could not parse the response from the backend after initializing the simulation');
        }
        ExperimentWorkbenchService.instance.serverURL = simResponse['serverURL'];
        this.serverURL = simResponse['serverURL'];
      }).catch((failure) => {
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
      await SimulationService.instance.updateState(
        ExperimentWorkbenchService.instance.serverURL,
        this.state.runningSimulationID,
        newState
      ).then((simInfo) => {
        console.debug('New simulation state is set: ' + simInfo.state);
        // Set STOPPED state by response (the other by MQTT)
        if (simInfo.state === EXPERIMENT_STATE.STOPPED) {
          this.setState({ simulationState: simInfo.state });
          this.setState({ simStateLoading: false });
          // clear simulationInfo for the finilized experiments
          ExperimentWorkbenchService.instance.simulationInfo = undefined;
          this.setState({ runningSimulationID: undefined });
        }
      });
    }
  }

  onButtonLayout() {
    console.info(this.state.modelFlexLayout.toJson());
  }

  showLeaveDialog(show) {
    this.setState({showLeaveDialog: show});
  }

  leaveWorkbench() {
    this.props.history.push({
      pathname: '/experiments-overview'
    });
  }

  getStatusStyle() {
    switch (this.state.simulationState) {
    case EXPERIMENT_STATE.STARTED:
      return 'simulation-status-started';
    case EXPERIMENT_STATE.PAUSED:
      return 'simulation-status-paused';
    case EXPERIMENT_STATE.FAILED:
      return 'simulation-status-error';
    default:
      return 'simulation-status-default';
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position='absolute' className={clsx(classes.appBar, this.state.drawerOpen && classes.appBarShift)}>
          <Toolbar className={classes.toolbar}>
            <IconButton
              edge='start'
              color='inherit'
              aria-label='open drawer'
              onClick={() => this.setState({ drawerOpen: true })}
              className={clsx(classes.menuButton, this.state.drawerOpen && classes.menuButtonHidden)}
            >
              <MenuIcon />
            </IconButton>
            {/* Initialize button*/}
            <IconButton
              color={
                this.state.availableServers.length && ExperimentWorkbenchService.instance.mqttConnected()
                  ? 'inherit'
                  : 'dark'
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
            >
              <FlightTakeoffIcon />
            </IconButton>
            {/* Play/pause button*/}
            {this.state.simulationState === EXPERIMENT_STATE.STARTED
              ?
              <IconButton color='inherit'
                onClick={() => this.onButtonPause()}
                disabled={
                  this.state.showLeaveDialog ||
                  this.state.simulationState !== EXPERIMENT_STATE.STARTED ||
                  this.state.simStateLoading
                }
                title='Pause'
              >
                <PauseIcon />
              </IconButton>
              :
              <IconButton color='inherit'
                onClick={() => this.onButtonStart()}
                disabled={
                  this.state.showLeaveDialog ||
                  this.state.runningSimulationID === undefined ||
                  this.state.simulationState !== EXPERIMENT_STATE.PAUSED ||
                  this.state.simStateLoading
                }
                title='Start'
              >
                <PlayCircleFilledWhiteIcon />
              </IconButton>
            }
            {/* Shutdown button*/}
            <IconButton color='inherit' className={classes.controlButton}
              onClick={() => this.onButtonShutdown()}
              disabled={
                this.state.showLeaveDialog ||
                EXPERIMENT_FINAL_STATE.includes(this.state.simulationState) ||
                this.state.simulationState === undefined ||
                this.state.simStateLoading
              }
              title='Shutdown experiment'
            >
              <StopIcon />
            </IconButton>
            {/* Exit button */}
            <IconButton color='inherit'
              onClick={() => this.setState({ showLeaveDialog: true })}
              title='Leave experiment'
            >
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
            <IconButton onClick={() => this.setState({ drawerOpen: false })}>
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
          <Grid container spacing={1} className={classes.container}>
            {/* Chart */}
            <Grid item xs={12}>
              <Paper className={clsx(classes.controlContainer, this.getStatusStyle())}>
                <ExperimentTimeBox value='real'/>
                <ExperimentTimeBox value='experiment'/>
                <ExperimentTimeBox value='remaining'/>
                <Typography align='left' variant='subtitle1' color='inherit' noWrap className={classes.title}>
                  Simulation State: {
                    this.state.simStateLoading ?
                      <CircularProgress size='1rem'/> :
                      this.state.simulationState
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
      </div>
    );
  }

}

ExperimentWorkbench.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withCookies(withStyles(useStyles)(ExperimentWorkbench));

ExperimentWorkbench.CONSTANTS = Object.freeze({
  INTERVAL_INTERNAL_UPDATE_MS: 1000
});
