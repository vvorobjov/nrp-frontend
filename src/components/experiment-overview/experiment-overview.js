import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service.js';
import PublicExperimentsService from '../../services/experiments/files/public-experiments-service.js';
import ExperimentServerService from '../../services/experiments/execution/server-resources-service.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';
import RemoteExperimentFilesService from '../../services/experiments/files/remote-experiment-files-service.js';

import ImportExperimentButtons from '../experiment-list/import-experiment-buttons.js';
import ExperimentList from '../experiment-list/experiment-list.js';
import NrpHeader from '../nrp-header/nrp-header.js';
import ExperimentFilesViewer from '../experiment-files-viewer/experiment-files-viewer.js';

import './experiment-overview.css';

export default class ExperimentOverview extends React.Component {
  static CONSTANTS = {
    TAB_INDEX: {
      MY_EXPERIMENTS: 0,
      NEW_EXPERIMENT: 1,
      MODEL_LIBRARIES: 2,
      EXPERIMENT_FILES: 3,
      TEMPLATES: 4,
      RUNNING_SIMULATIONS: 5
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      storageExperiments: [],
      publicExperiments: [],
      joinableExperiments: [],
      availableServers: [],
      startingExperiment: undefined,
      selectedTabIndex: ExperimentOverview.CONSTANTS.TAB_INDEX.MY_EXPERIMENTS
    };
  }

  async componentDidMount() {
    this.onUpdateServerAvailability = this.onUpdateServerAvailability.bind(this);
    ExperimentServerService.instance.addListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    this.onStartExperiment = this.onStartExperiment.bind(this);
    ExperimentExecutionService.instance.addListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );

    this.onUpdateStorageExperiments = this.onUpdateStorageExperiments.bind(this);
    ExperimentStorageService.instance.addListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdateStorageExperiments
    );

    this.onUpdatePublicExperiments = this.onUpdatePublicExperiments.bind(this);
    PublicExperimentsService.instance.addListener(
      PublicExperimentsService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdatePublicExperiments
    );
  }

  componentWillUnmount() {
    ExperimentServerService.instance.removeListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    ExperimentServerService.instance.removeListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );

    ExperimentStorageService.instance.removeListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdateStorageExperiments
    );

    PublicExperimentsService.instance.removeListener(
      PublicExperimentsService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdatePublicExperiments
    );
  }

  onUpdateServerAvailability(availableServers) {
    this.setState({ availableServers: availableServers });
  };

  onStartExperiment(experiment) {
    this.setState({ startingExperiment: experiment });
  };

  onUpdateStorageExperiments(storageExperiments) {
    let joinableExperiments = storageExperiments/*.filter(
      experiment => experiment.joinableServers && experiment.joinableServers.length > 0)*/;
    this.setState({
      storageExperiments: storageExperiments,
      joinableExperiments: joinableExperiments
    });
  }

  onUpdatePublicExperiments(publicExperiments) {
    this.setState({
      publicExperiments: publicExperiments //.filter(exp => exp.configuration.maturity === 'production')
    });
  }

  onSelectTab(index, lastIndex){
    this.setState({selectedTabIndex: index});
    if (index===3 && lastIndex!==3){
      RemoteExperimentFilesService.instance.notifyNotSupported();
    }
  }

  render() {

    console.info(this.state.storageExperiments);
    return (
      <div className='experiment-overview-wrapper'>
        <div className='experiment-overview-header'>
          <NrpHeader title1='EXPERIMENT' title2='OVERVIEW' />
        </div>

        <Tabs className="tabs-view" id="tabs-experiment-lists"
          selectedIndex={this.state.selectedTabIndex}
          onSelect={(index, lastIndex) => this.onSelectTab(index, lastIndex)} >
          <TabList>
            <Tab>My Experiments</Tab>
            <Tab>New Experiment</Tab>
            <Tab>Model Libraries</Tab>
            <Tab>Experiment Files</Tab>
            <Tab>Templates</Tab>
            <Tab>Running Simulations</Tab>
          </TabList>

          {/* My Experiments */}
          <TabPanel>
            <ImportExperimentButtons />
            <ExperimentList experiments={this.state.storageExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment}
              selectExperimentOverviewTab={(index) => this.setState({ selectedTabIndex: index })}/>
          </TabPanel>
          {/* New Experiment */}
          <TabPanel>
            <h2>"New Experiment" tab coming soon ...</h2>
          </TabPanel>
          {/* Model Libraries */}
          <TabPanel>
            <h2>"Model Libraries" tab coming soon ...</h2>
          </TabPanel>
          {/* Experiment Files */}
          <TabPanel>
            <ExperimentFilesViewer experiments={this.state.storageExperiments}/>
          </TabPanel>
          {/* Templates */}
          <TabPanel>
            <ExperimentList experiments={this.state.publicExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment}
              selectExperimentOverviewTab={(index) => this.setState({ selectedTabIndex: index })} />
          </TabPanel>
          {/* Running Simulations */}
          <TabPanel>
            <ExperimentList
              experiments={this.state.joinableExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment} />
          </TabPanel>
        </Tabs>
      </div>
    );
  }
}
