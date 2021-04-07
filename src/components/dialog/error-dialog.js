import React from 'react';
import { Modal, Button } from 'react-bootstrap';

import ErrorHandlerService from '../../services/error-handler-service.js';

import './error-dialog.css';

/**
 *
 */
class ErrorDialog extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      isErrorSourceDisplayed: false
    };
  }

  async componentDidMount() {
    ErrorHandlerService.instance.addListener(
      ErrorHandlerService.EVENTS.ERROR, (error) => {
        this.onError(error);
      });
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
    const error = this.state.error;
    return (
      <div>
        {error?
          <div className="modal-dialog-wrapper">
            <Modal.Dialog className="modal-dialog">
              <Modal.Header>
                <h4>{error.type}</h4>
              </Modal.Header>
              <Modal.Body>
                <h5>Details</h5><pre>{error.message}</pre>
                {this.state.isErrorSourceDisplayed
                  ?<div>
                    {!error.code && !error.data && !error.stack
                      ? <h6>No scary details</h6>
                      : null}
                    {this.state.error.code
                      ? <div><h6>Code</h6><pre>{this.state.error.code}</pre></div>
                      : null}
                    {this.state.error.data
                      ? <div><h6>Data</h6><pre>{this.state.error.data}</pre></div>
                      : null}
                    {this.state.error.stack
                      ? <div><h6>Stack Trace</h6><pre>{this.state.error.stack}</pre></div>
                      : null}
                  </div>
                  : null
                }
              </Modal.Body>
              <Modal.Footer>
                <div>
                  <Button variant="outline-dark" onClick={() => this.handleClose()}>
                    <span className="glyphicon glyphicon-remove"></span> Close
                  </Button>
                  <Button variant="outline-dark" className="pull-right" onClick={() => this.sourceDisplay()}>
                    {this.state.isErrorSourceDisplayed ? 'Hide' : 'Show'} scary details <span className="caret"></span>
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