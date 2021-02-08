import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service.js';
import SharedExperimentsService from '../../services/experiments/files/shared-experiments-service.js';
import ExperimentServerService from '../../services/experiments/execution/server-resources-service.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';

import ExperimentList from '../experiment-list/experiment-list.js';
import NrpHeader from '../nrp-header/nrp-header.js';

import './experiment-overview.css';

export default class ExperimentOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      storageExperiments: [],
      templateExperiments: [],
      joinableExperiments: [],
      availableServers: [],
      startingExperiment: undefined
    };
  }

  async componentDidMount() {
    try {
      const storageExperiments = await ExperimentStorageService.instance.getExperiments();
      const templateExperiments = await SharedExperimentsService.instance.getExperiments();
      this.setState({
        storageExperiments: storageExperiments,
        templateExperiments: templateExperiments
      });
    }
    catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }

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

    this.onUpdateExperiments = this.onUpdateStorageExperiments.bind(this);
    ExperimentStorageService.instance.addListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdateStorageExperiments
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
  }

  onUpdateServerAvailability(availableServers) {
    this.setState({ availableServers: availableServers });
  };

  onStartExperiment(experiment) {
    this.setState({ startingExperiment: experiment });
  };

  onUpdateStorageExperiments(storageExperiments) {
    let joinableExperiments = storageExperiments.filter(
      experiment => experiment.joinableServers && experiment.joinableServers.length > 0);
    this.setState({
      storageExperiments: storageExperiments,
      joinableExperiments: joinableExperiments
    });
  }

  render() {
    return (
      <div className='experiment-overview-wrapper'>
        <div className='experiment-overview-header'>
          <NrpHeader title1='EXPERIMENT' title2='OVERVIEW' />
        </div>

        <Tabs className="tabs-view">
          <TabList>
            <Tab>My Experiments</Tab>
            <Tab>New Experiment</Tab>
            <Tab>Model Libraries</Tab>
            <Tab>Experiment Files</Tab>
            <Tab>Templates</Tab>
            <Tab>Running Simulations</Tab>
          </TabList>

          <TabPanel>
            <ExperimentList experiments={this.state.storageExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment} />
          </TabPanel>
          <TabPanel>
            <h2>"New Experiment" tab coming soon ...</h2>
          </TabPanel>
          <TabPanel>
            <h2>"Model Libraries" tab coming soon ...</h2>
          </TabPanel>
          <TabPanel>
            <h2>"Experiment Files" tab coming soon ...</h2>
          </TabPanel>
          <TabPanel>
            <ExperimentList experiments={this.state.templateExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment} />
          </TabPanel>
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
