import React from 'react';
import { Toast } from 'react-bootstrap';

import DialogService from '../../services/dialog-service.js';

import './notification-dialog.css';

export default class NotificationDialog extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      notifications: []
    };
  }

  async componentDidMount() {
    this.onNotification = this.onNotification.bind(this);
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
    // avoid duplicates
    var isIn = false;
    this.state.notifications.forEach((oldNotification) =>{
      if (notification.type === oldNotification.type &&
        notification.title === oldNotification.title &&
        notification.message === oldNotification.message &&
        notification.details === oldNotification.details){
        isIn = true;
      }
    });
    if (!isIn){
      this.setState({
        notifications: [...this.state.notifications, notification]
      });
    }
  }

  handleClose(index) {
    var copy = [...this.state.notifications];
    copy.splice(index, 1);
    this.setState({
      notifications: copy
    });
  }

  getNotificationDelay(notification) {
    switch (notification.type) {
    case DialogService.CONSTANTS.INFO:
      return 10000;
    case DialogService.CONSTANTS.WARNING:
      return 60000;
    default:
      return -1;
    }
  }

  getAutohide(notification) {
    switch (notification.type) {
    case DialogService.CONSTANTS.INFO:
    case DialogService.CONSTANTS.WARNING:
      return true;
    case DialogService.CONSTANTS.ERROR:
    case DialogService.CONSTANTS.CRITICAL:
      return false;
    default:
      return true;
    }
  }

  render(){
    let notifications = this.state.notifications;
    return(
      <div className='toast-notification-wrapper'>
        {notifications.length!==0?
          <ol>
            {notifications.map((notification, index) => {
              return (
                <li key={index} className='no-style'>
                  <Toast className='toast-width' onClose={(index) => this.handleClose(index)}
                    delay={this.getNotificationDelay(notification)} autohide={this.getAutohide(notification)}>
                    <Toast.Header className={notification.type}>
                      <strong>{notification.title}</strong>
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