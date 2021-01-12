import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';
//import ExperimentServerService from '../../services/experiments/execution/experiment-server-service.js';
//import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';

import ExperimentList from '../experiment-list/experiment-list.js';
import NrpHeader from '../nrp-header/nrp-header.js';

import './experiment-overview.css';

export default class ExperimentOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      experiments: [],
      pageState: {}
    };
  }

  async componentDidMount() {
    try {
      const experiments = await ExperimentStorageService.instance.getExperiments();
      this.setState({
        experiments: experiments
      });
    }
    catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }

    /*this.onUpdateServerAvailability = this.onUpdateServerAvailability.bind(this);
    ExperimentServerService.instance.addListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    this.onStartExperiment = this.onStartExperiment.bind(this);
    ExperimentExecutionService.instance.addListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );*/
  }

  componentWillUnmount() {
    /*ExperimentServerService.instance.removeListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    ExperimentServerService.instance.removeListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );*/
  }

  /*onUpdateServerAvailability(availableServers) {
    this.setState({availableServers: availableServers});
  };

  onStartExperiment(experiment) {
    this.setState({startingExperiment: experiment});
  };*/

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
            <ExperimentList />
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
            <h2>"Templates" tab coming soon ...</h2>
          </TabPanel>
          <TabPanel>
            <h2>"Running Simulations" tab coming soon ...</h2>
          </TabPanel>
        </Tabs>
      </div>
    );
  }
}
