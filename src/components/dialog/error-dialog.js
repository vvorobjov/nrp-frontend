import React from 'react';
import { Modal, Button } from 'react-bootstrap';

import DialogService from '../../services/dialog-service.js';

import './error-dialog.css';

class ErrorDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      isErrorSourceDisplayed: false
    };
  }

  async componentDidMount() {
    this.onError = this.onError.bind(this);
    DialogService.instance.addListener(
      DialogService.EVENTS.ERROR, this.onError
    );
  }

  componentWillUnmount() {
    DialogService.instance.removeListener(
      DialogService.EVENTS.ERROR, this.onError
    );
  }

  onError(error) {
    this.setState({
      error: error
    });
  }

  handleClose() {
    this.setState({
      error: undefined,
      isErrorSourceDisplayed: false
    });
  }

  sourceDisplay() {
    this.setState({
      isErrorSourceDisplayed: !this.state.isErrorSourceDisplayed
    });
  }

  render(){
    let error = this.state.error;
    return (
      <div>
        {error?
          <div className="error-dialog-wrapper">
            <Modal.Dialog>
              <Modal.Header className="modal-header">
                <h4>{error.type}</h4>
              </Modal.Header>
              <Modal.Body>
                {error.message}
                {this.state.isErrorSourceDisplayed
                  ? <div>
                    {!error.code && !error.data && !error.stack
                      ? <h6>No scary details</h6>
                      : null}
                    {error.code
                      ? <div><h6>Code</h6><pre>{error.code}</pre></div>
                      : null}
                    {error.data
                      ? <div><h6>Data</h6><pre>{error.data}</pre></div>
                      : null}
                    {error.stack
                      ? <div><h6>Stack Trace</h6><pre>{error.stack}</pre></div>
                      : null}
                  </div>
                  : null
                }
              </Modal.Body>
              <Modal.Footer>
                <div>
                  <Button variant="warning" onClick={() => this.handleClose()}>
                    <span className="glyphicon glyphicon-remove"></span> Close
                  </Button>
                  <Button variant="light" onClick={() => this.sourceDisplay()}>
                    {this.state.isErrorSourceDisplayed ? 'Hide' : 'Show'} scary details <span></span>
                  </Button>
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </div>
          : null}
      </div>
    );
  }
}

export default ErrorDialog;