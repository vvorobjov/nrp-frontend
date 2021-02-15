import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
//import Tabs from 'react-bootstrap/Tabs';
//import Tab from 'react-bootstrap/Tab';
import 'react-tabs/style/react-tabs.css';

import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service.js';
import PublicExperimentsService from '../../services/experiments/files/public-experiments-service.js';
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
      publicExperiments: [],
      joinableExperiments: [],
      availableServers: [],
      startingExperiment: undefined,
      selectedTabIndex: 0
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
    let joinableExperiments = storageExperiments.filter(
      experiment => experiment.joinableServers && experiment.joinableServers.length > 0);
    this.setState({
      storageExperiments: storageExperiments,
      joinableExperiments: joinableExperiments
    });
  }

  onUpdatePublicExperiments(publicExperiments) {
    this.setState({
      publicExperiments: publicExperiments.filter(exp => exp.configuration.maturity === 'production')
    });
  }

  selectTab(index) {
    this.setState({ selectedTabIndex: index });
  }

  render() {
    return (
      <div className='experiment-overview-wrapper'>
        <div className='experiment-overview-header'>
          <NrpHeader title1='EXPERIMENT' title2='OVERVIEW' />
        </div>

        <Tabs className="tabs-view" id="tabs-experiment-lists"
          selectedIndex={this.state.selectedTabIndex}
          onSelect={(index) => this.setState({ selectedTabIndex: index })}
          /*activeKey={this.state.selectedTabKey}
          onSelect={(key) => this.setState({ selectedTabKey: key })}*/>
          <TabList>
            <Tab>My Experiments</Tab>
            <Tab>New Experiment</Tab>
            <Tab>Model Libraries</Tab>
            <Tab>Experiment Files</Tab>
            <Tab>Templates</Tab>
            <Tab>Running Simulations</Tab>
          </TabList>

          {/* My Experiments */}
          <TabPanel /*Tab title='My Experiments' eventKey='my-experiments'*/>
            <ExperimentList experiments={this.state.storageExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment} />
          </TabPanel>
          {/* New Experiment */}
          <TabPanel /*Tab title='New Experiment' eventKey='new-experiment'*/>
            <h2>"New Experiment" tab coming soon ...</h2>
          </TabPanel>
          {/* Model Libraries */}
          <TabPanel /*Tab title='Model Libraries' eventKey='model-libraries'*/>
            <h2>"Model Libraries" tab coming soon ...</h2>
          </TabPanel>
          {/* Experiment Files */}
          <TabPanel /*Tab title='Experiment Files' eventKey='experiment-files'*/>
            <h2>"Experiment Files" tab coming soon ...</h2>
          </TabPanel>
          {/* Templates */}
          <TabPanel /*Tab title='Template Experiments' eventKey='template-experiments'*/>
            <ExperimentList experiments={this.state.publicExperiments}
              availableServers={this.state.availableServers}
              startingExperiment={this.state.startingExperiment}
              selectExperimentOverviewTab={(index) => this.setState({ selectedTabIndex: index })} />
          </TabPanel>
          {/* Running Simulations */}
          <TabPanel /*Tab title='Running Experiments' eventKey='running-experiments'*/>
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
