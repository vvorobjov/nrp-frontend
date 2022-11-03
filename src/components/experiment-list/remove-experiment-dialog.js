import React from 'react';
import {Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';

import './remove-experiment-dialog.css';

export default class RemoveExperimentDialog extends React.Component{
  render(){
    return (
      <div>
        <div>
          <Modal  className='remove-experiment-dialog-wrapper'
            show={this.props.visible} onHide={() => this.props.setVisibility(false)}
          >
            <Modal.Header closeButton className="remove-experiment-dialog-header">
              <Modal.Title>Remove experiment menu</Modal.Title>
            </Modal.Header>
            <Modal.Body>Would you like to remove the experiment? This action cannot be undone!</Modal.Body>
            <Modal.Footer>
              <div>
                <Button variant="light" onClick={() => this.props.setVisibility(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => this.props.removeExperiment()}>
                  Remove
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }
}