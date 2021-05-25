import React from 'react';
import {Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';

import './leave-simulation-dialog.css';

class LeaveSimulationDialog extends React.Component{
  render(){
    return (
      <div>
        <div>
          <Modal show={this.props.visible} onHide={() => this.props.setVisibility(false)}>
            <Modal.Header closeButton className="leave-simulation-dialog-header">
              <Modal.Title>Exit menu</Modal.Title>
            </Modal.Header>
            <Modal.Body>Would you like to leave or stop the simulation?</Modal.Body>
            <Modal.Footer>
              <div>
                <Button variant="light" onClick={() => this.props.leaveSimulation()}>
                  Leave
                </Button>
                <Button variant="danger" onClick={() => this.props.stopSimulation()}>
                  Stop
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }
}

export default LeaveSimulationDialog;