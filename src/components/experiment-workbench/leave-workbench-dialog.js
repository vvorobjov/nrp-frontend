import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import StopIcon from '@material-ui/icons/Stop';

export default class LeaveWorkbenchDialog extends React.Component{
  render(){
    return (
      <div>
        <Dialog
          open={this.props.visible}
          onClose={() => this.props.setVisibility(false)}
          id='leave-workbench-dialog'
        >
          <DialogTitle>Exit menu</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Would you like to leave or stop the simulation?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => this.props.leaveWorkbench()}
              color='default'
              variant="contained"
              endIcon={<ExitToAppIcon>send</ExitToAppIcon>}
            >
              Leave
            </Button>
            <Button onClick={() => this.props.stopSimulation()}
              color='secondary'
              variant="contained"
              endIcon={<StopIcon>send</StopIcon>}
            >
              Stop
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}
