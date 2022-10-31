import React from 'react';
import FlexLayout from 'flexlayout-react';

import ExperimentToolsService from './experiment-tools-service';
import ExperimentWorkbenchService from './experiment-workbench-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';
import RunningSimulationService from '../../services/experiments/execution/running-simulation-service';
import DialogService from '../../services/dialog-service';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';
import timeDDHHMMSS from '../../utility/time-filter';

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
import Badge from '@material-ui/core/Badge';
import NotificationsIcon from '@material-ui/icons/Notifications';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';

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
    alignItems: 'center'
  },
  // TODO: Fix vertical filling
  contentContainer: {
    height: '80vh',
    padding: theme.spacing(1),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column'
  },
  statusWarning: {
    backgroundColor: 'magenta'
  }
});


class ExperimentWorkbench extends React.Component {
  constructor(props) {
    super(props);

    const {experimentID} = props.match.params;
    this.experimentID = experimentID;
    this.serverURL = 'http://' + this.serverIP + ':8080'; // this should probably be part of some config

    this.state = {
      modelFlexLayout: FlexLayout.Model.fromJson(jsonBaseLayout),
      showLeaveDialog: false,
      drawerOpen: false,
      notificationCount: 0,
      simulationState: EXPERIMENT_STATE.CREATED,
      nrpVersion: '4.0.0',
      experimentConfiguration: {}
    };

    ExperimentWorkbenchService.instance.experimentID = this.experimentID;

    this.refLayout = React.createRef();
  }

  async UNSAFE_componentWillMount() {
    let experiments = await ExperimentStorageService.instance.getExperiments();
    const experimentInfo = experiments.find(experiment => experiment.id === this.experimentID);
    ExperimentWorkbenchService.instance.experimentInfo = experimentInfo;

    this.setState({experimentConfiguration: experimentInfo.configuration});
  };

  async componentDidMount() {
  }

  async componentDidUpdate() {
  }

  /*async updateSimulationInfo() {
    let simInfo = await RunningSimulationService.instance.getInfo(this.serverURL, this.simulationID);
    this.setState({simulationInfo: simInfo});
    console.info('SimulationView.updateSimulationInfo - simulationInfo');
    console.info(this.state.simulationInfo);
  }*/

  onStatusInfoROS(message) {
    this.setState({
      timingRealtime: timeDDHHMMSS(message.realTime),
      timingSimulationTime: timeDDHHMMSS(message.simulationTime),
      timingTimeout: timeDDHHMMSS(message.timeout)
    });
  }

  async onButtonStartPause() {
    let newState = this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
      ? EXPERIMENT_STATE.STARTED
      : EXPERIMENT_STATE.PAUSED;
    await RunningSimulationService.instance.updateState(this.serverURL, this.simulationID, newState);

    this.updateSimulationInfo();
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
    case EXPERIMENT_STATE.ERROR:
      return 'simulation-status-error';
    default:
      return 'simulation-status-default';
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        {/* <div className='simulation-view-header'>
            <div className='simulation-view-controls'>
              <div className='simulation-view-control-buttons'>
                <button className='nrp-btn btn-default' onClick={() => this.showLeaveDialog(true)}>
                  <GiExitDoor className='icon' />
                </button>
                <button disabled={true} className='nrp-btn btn-default'><VscDebugRestart className='icon' /></button>
                <button className='nrp-btn btn-default' onClick={() => {
                  this.onButtonStartPause();
                }}>
                  {this.state.simulationInfo && this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
                    ? <RiPlayFill className='icon' />
                    : <RiPauseFill className='icon' />}
                </button>
                <button disabled={true} className='nrp-btn btn-default'>
                  <TiMediaRecord clasexperimentInfosName='icon' /></button>
              </div>

              <div className='simulation-view-time-info'>
                <div>Simulation time:</div>
                <div>{this.state.timingSimulationTime}</div>
                <div>Real time:</div>
                <div>{this.state.timingRealtime}</div>
                <div>Real timeout:</div>
                <div>{this.state.timingTimeout}</div>
              </div>
            </div>

            <div className='simulation-view-experiment-title'>
              <div>{this.state.experimentName}</div>
            </div>
            <button className='nrp-btn btn-default' onClick={() => {
              this.onButtonLayout();
            }}><RiLayout6Line className='icon' /></button>
          </div> */}
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
            {/* Play/pause button*/}
            {this.state.simulationState === EXPERIMENT_STATE.STARTED
              ?
              <IconButton color='inherit'
                onClick={() => {
                  this.setState({simulationState: EXPERIMENT_STATE.PAUSED});
                  DialogService.instance.progressNotification({message:'The experiment is paused'});
                }}
                disabled={this.state.showLeaveDialog}
              >
                <PauseIcon />
              </IconButton>
              :
              <IconButton color='inherit'
                onClick={() => {
                  this.setState({ simulationState: EXPERIMENT_STATE.STARTED });
                  DialogService.instance.progressNotification({message:'The experiment is started'});

                }}
                disabled={this.state.showLeaveDialog}
              >
                <PlayCircleFilledWhiteIcon />
              </IconButton>
            }
            {/* Stop button*/}
            <IconButton color='inherit' className={classes.controlButton}
              disabled={this.state.showLeaveDialog}
              onClick={() => this.setState({ simulationState: EXPERIMENT_STATE.STOPPED })}
            >
              <StopIcon />
            </IconButton>
            {/* Exit button */}
            <IconButton color='inherit'
              onClick={() => this.setState({ showLeaveDialog: true })}
            >
              <ExitToAppIcon />
            </IconButton>
            {/* Title */}
            <Typography align='center' component='h1' variant='h6' color='inherit' noWrap className={classes.title}>
              <span>{this.state.experimentConfiguration.SimulationName}</span>
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
          <List>
            {Array.from(ExperimentToolsService.instance.tools.values()).map((tool, index) => {
              return (
                <ListItem button key={index}
                  onMouseDown={() => {
                    ExperimentToolsService.instance.startToolDrag(
                      tool.flexlayoutNode,
                      this.refLayout);
                  }}
                  onClick={() => {
                    ExperimentToolsService.instance.addTool(
                      tool.flexlayoutNode,
                      this.refLayout);
                  }}
                >
                  <ListItemIcon >
                    {tool.getIcon()}
                  </ListItemIcon>
                  <ListItemText primary={tool.flexlayoutNode.name} />
                </ListItem>
              );
            })}
          </List>
        </Drawer>
        {/* This is the leaving dialog */}
        <LeaveWorkbenchDialog visible={this.state.showLeaveDialog}
          setVisibility={(visible) => this.showLeaveDialog(visible)}
          stopSimulation={async () => {
            await RunningSimulationService.instance.updateState(this.serverURL, this.simulationID,
              EXPERIMENT_STATE.STOPPED);
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
                <Typography align='left' variant='subtitle1' color='inherit' noWrap className={classes.title}>
                  Experiment Timeout: {this.state.experimentConfiguration.SimulationTimeout}
                </Typography>
                <Typography align='left' variant='subtitle1' color='inherit' noWrap className={classes.title}>
                  Experiment Time: {this.state.experimentTime}
                </Typography>
                <Typography align='left' variant='subtitle1' color='inherit' noWrap className={classes.title}>
                  Simulation State: {this.state.simulationState}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper className={classes.contentContainer}>
                <FlexLayout.Layout ref={this.refLayout} model={this.state.modelFlexLayout}
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

export default withStyles(useStyles)(ExperimentWorkbench);

ExperimentWorkbench.CONSTANTS = Object.freeze({
  INTERVAL_INTERNAL_UPDATE_MS: 1000
});
