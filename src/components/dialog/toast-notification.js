import React from 'react';
import { Toast } from 'react-bootstrap';

import DialogService from '../../services/dialog-service.js';

import './toast-notification.css';

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
    this.setState({
      notifications: [...this.state.notifications, notification]
    });
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
        {!notifications.length==0?
          <ol>
            {notifications.map((notification, index) => {
              return (
                <li key={index} className='no-style'>
                  <Toast onClose={(index) => this.handleClose(index)}>
                    <Toast.Header>
                      <h4>{notification.type}</h4>
                    </Toast.Header>
                    <Toast.Body>
                      {notification.message}
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