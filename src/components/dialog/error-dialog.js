import React from 'react';
import { Modal, Button, Collapse } from 'react-bootstrap';
import { VscClose, VscChevronDown, VscChevronUp } from 'react-icons/vsc';

import DialogService from '../../services/dialog-service.js';

import './error-dialog.css';

class ErrorDialog extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      // Queue of incoming errors; the head is displayed and the rest wait
      // their turn so no error is silently dropped.
      errors: [],
      isErrorSourceDisplayed: false
    };
    this.onError = this.onError.bind(this);
  }

  componentDidMount() {
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
    // Append every error so subsequent ones are shown in turn instead of
    // being discarded while one is already on screen.
    this.setState((prevState) => ({
      errors: [...prevState.errors, error]
    }));
  }

  handleClose() {
    // Drop the current error and reveal the next queued one (if any).
    this.setState((prevState) => ({
      errors: prevState.errors.slice(1),
      isErrorSourceDisplayed: false
    }));
  }

  toggleSourceDisplay() {
    this.setState((prevState) => ({
      isErrorSourceDisplayed: !prevState.isErrorSourceDisplayed
    }));
  }

  hasTechnicalDetails(error) {
    return Boolean(error.code || error.data || error.stack);
  }

  formatDetail(value) {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    }
    catch (e) {
      return String(value);
    }
  }

  render(){
    const error = this.state.errors[0];
    if (!error) {
      return null;
    }

    const showDetails = this.state.isErrorSourceDisplayed;
    const queuedCount = this.state.errors.length - 1;

    return (
      <Modal
        show
        onHide={() => this.handleClose()}
        keyboard
        backdrop
        centered
        aria-labelledby="error-dialog-title"
        className="error-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title id="error-dialog-title" as="h4">{error.type}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="error-dialog-message">{error.message}</p>
          {this.hasTechnicalDetails(error)
            ? <div>
              <Button
                variant="link"
                className="error-dialog-details-toggle"
                onClick={() => this.toggleSourceDisplay()}
                aria-expanded={showDetails}
                aria-controls="error-dialog-technical-details"
              >
                {showDetails ? <VscChevronUp /> : <VscChevronDown />}
                {showDetails ? ' Hide technical details' : ' Show technical details'}
              </Button>
              <Collapse in={showDetails}>
                <div id="error-dialog-technical-details">
                  {error.code
                    ? <div><h6>Code</h6><pre>{this.formatDetail(error.code)}</pre></div>
                    : null}
                  {error.data
                    ? <div><h6>Data</h6><pre>{this.formatDetail(error.data)}</pre></div>
                    : null}
                  {error.stack
                    ? <div><h6>Stack trace</h6><pre>{this.formatDetail(error.stack)}</pre></div>
                    : null}
                </div>
              </Collapse>
            </div>
            : null}
        </Modal.Body>
        <Modal.Footer>
          {queuedCount > 0
            ? <span className="error-dialog-queue-count">
              {queuedCount} more {queuedCount > 1 ? 'errors' : 'error'} queued
            </span>
            : null}
          <Button variant="warning" onClick={() => this.handleClose()}>
            <VscClose /> Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ErrorDialog;
