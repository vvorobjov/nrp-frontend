import React from 'react';
import { Toast } from 'react-bootstrap';

import DialogService from '../../services/dialog-service.js';

import './notification-dialog.css';

class NotificationDialog extends React.Component{
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
    this.state.notifications.forEach((notif) =>{
      if (notification.type===notif.type && notification.message===notif.message){
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
                    delay={notification.type==='Warning'? 60000: 10000} autohide>
                    <Toast.Header className={notification.type==='Warning'? 'warning': 'info'} >
                      <strong className='mr-auto'>{notification.type}</strong>
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