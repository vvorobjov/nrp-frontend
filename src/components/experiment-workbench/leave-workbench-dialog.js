import React from 'react';
import {Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';

import './leave-workbench-dialog.css';

export default class LeaveWorkbenchDialog extends React.Component{
  render(){
    return (
      <div>
        <div>
          <Modal  className='leave-workbench-dialog-wrapper'
            show={this.props.visible} onHide={() => this.props.setVisibility(false)}
          >
            <Modal.Header closeButton className="leave-workbench-dialog-header">
              <Modal.Title>Exit menu</Modal.Title>
            </Modal.Header>
            {this.props.shutdownDisabled ?
              <Modal.Body>Would you like to leave the simulation?</Modal.Body> :
              <Modal.Body>Would you like to leave or shutdown the simulation?</Modal.Body>
            }
            <Modal.Footer>
              <div>
                <Button variant="light" onClick={() => this.props.leaveWorkbench()}>
                  Leave
                </Button>
                <Button
                  disabled={this.props.shutdownDisabled}
                  variant="danger"
                  onClick={() => this.props.shutdownSimulation()}
                >
                  Shutdown
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }
}