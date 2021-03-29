import React from 'react';

import { HashRouter, Switch, Route } from 'react-router-dom';

import EntryPage from './components/entry-page/entry-page.js';
import ErrorHandlerService from './services/error-handler-service.js';
import ErrorDialog from './components/dialog/error-dialog.js';
import ExperimentOverview from './components/experiment-overview/experiment-overview.js';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      error: undefined
    };
  }

  async componentDidMount() {
    this.onUpdateError = this.onUpdateError.bind(this);
    ErrorHandlerService.instance.addListener(
      ErrorHandlerService.EVENTS.UPDATE_ERROR,
      this.onUpdateError
    );
  }

  componentWillUnmount() {
    ErrorHandlerService.instance.removeListener(
      ErrorHandlerService.EVENTS.UPDATE_ERROR,
      this.onUpdateError
    );
  }

  onUpdateError(error) {
    this.setState({
      error: error
    });
  }

  render() {
    if (this.state.error){
      return (<ErrorDialog error={this.state.error}/>);
    }
    else{
      return(
        <HashRouter>
          <Switch>
            <Route path='/experiments-overview'>
              <ExperimentOverview />
            </Route>
            <Route path='/'>
              <EntryPage />
            </Route>
          </Switch>
        </HashRouter>
      );
    }
  }
}

export default App;
