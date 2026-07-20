import React from 'react';
import { Toast } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

import DialogService from '../../services/dialog-service.js';

import './notification-dialog.css';

class NotificationDialog extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      notifications: []
    };
    this.infoDelayMS = 6000;
    this.warnDelayMS = 15000;
    this.onNotification = this.onNotification.bind(this);
  }

  componentDidMount() {
    DialogService.instance.addListener(
      DialogService.EVENTS.NOTIFICATION, this.onNotification
    );
  }

  componentWillUnmount() {
    DialogService.instance.removeListener(
      DialogService.EVENTS.NOTIFICATION, this.onNotification
    );
  }

  onNotification(notification) {
    this.setState((prevState) => {
      // Ignore an identical notification (same type and message) that is
      // already visible.
      const isDuplicate = prevState.notifications.some(
        (notif) => notif.type === notification.type && notif.message === notification.message
      );
      if (isDuplicate) {
        return null;
      }
      // Replace any earlier notification of the same type, then append the new
      // one carrying a stable id so it can later be dismissed unambiguously.
      const remaining = prevState.notifications.filter(
        (notif) => notif.type !== notification.type
      );
      return {
        notifications: [...remaining, { ...notification, id: uuidv4() }]
      };
    });
  }

  handleClose(id) {
    // Dismiss by stable id rather than array index so the correct toast is
    // removed even when several are visible or one auto-hides.
    this.setState((prevState) => ({
      notifications: prevState.notifications.filter((notif) => notif.id !== id)
    }));
  }

  render(){
    let notifications = this.state.notifications;
    return(
      <div className='toast-notification-wrapper'>
        {notifications.length!==0?
          <ol>
            {notifications.map((notification) => {
              return (
                <li key={notification.id} className='no-style'>
                  <Toast className='toast-width' onClose={() => this.handleClose(notification.id)}
                    delay={notification.type === 'Warning' ? this.warnDelayMS : this.infoDelayMS}
                    animation={true} autohide={true}>
                    <Toast.Header className={notification.type === 'Warning' ? 'warning' : 'info'} >
                      <strong className='me-auto'>{notification.type}</strong>
                    </Toast.Header>
                    <Toast.Body>
                      <h6>{notification.message}</h6>
                      {notification.details}
                    </Toast.Body>
                  </Toast>
                </li>
              );
            })}
          </ol>
          : null
        }
      </div>
    );
  }
}

export default NotificationDialog;
