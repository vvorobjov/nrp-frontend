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
      open: false,
      isErrorSourceDisplayed: false
    };
  }

  componentDidMount() {
    ErrorHandlerService.instance.addListener(
      ErrorHandlerService.EVENTS.ERROR, (error) => {
        this.onError(error);
      });
  }

  onError(error) {
    console.info(error);
    this.setState({error: error});
  }

  handleClose() {}

  sourceDisplay() {
    this.setState({
      isErrorSourceDisplayed: true
    });
  }

  render(){
    let error = this.state.error;
    return (
      <div>
        { this.state.error ?
          <div className="modal-dialog-wrapper" onClick={event => event.stopPropagation()}>
            <Modal.Dialog className="modal-dialog">
              <Modal.Header>
                <h4>{error.type}</h4>
              </Modal.Header>
              <Modal.Body>
                <p>{error.message}</p>
              </Modal.Body>
              <Modal.Footer>
                <div>
                  <Button variant="outline-dark" onClick={this.handleClose()}>
                    <span className="glyphicon glyphicon-remove"></span> Close
                  </Button>
                  <Button variant="outline-dark" className="pull-right" /*onClick={this.sourceDisplay()}*/>
                    {this.state.isErrorSourceDisplayed ? 'Hide' : 'Show'} scary details <span className="caret"></span>
                  </Button>
                </div>
                {!this.state.isErrorSourceDisplayed
                  ?<div>
                    <h5>Error Type</h5><pre>{error.type}</pre>
                    <h6>Error Code</h6><pre>{error.code}</pre>
                    <h6>Message</h6><pre>{error.message}</pre>
                    {error.data
                      ? <div><h6>Data</h6><pre>{error.data}</pre></div>
                      : null}
                    <div><h6>Stack Trace</h6><pre>{error.stack}</pre></div>
                  </div>
                  : null
                }
              </Modal.Footer>
            </Modal.Dialog>
          </div>
          : null}
      </div>
    );
  }
}

export default ErrorDialog;