import { Toast } from 'bootstrap';
import React from 'react'

import DialogService from '../../services/dialog-service.js'

class NotificationDialog extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      notifications: [],
    };
  }

  async componentDidMount() {
    DialogService.instance.addListener(
      DialogService.EVENTS.NOTIFICATION, (notification) => {
        this.onNotification(notification);
      }
    );
  }

  onNotification(notification) {
    this.setState({
      notifications: this.state.notifications.append(notification)
    });
  }

  onClose(index) {
    this.setState({
      notifications: notifications.splice(index, 1)
    });
  }

  render(){
    return(
        <div>
          {this.state.notifications?
            <ol>
              {this.state.notifications.map(notification => {
                return (
                  <div className="toast-dialog-wrapper">
                    <Toast.Dialog onClose={this.onClose(index)}>
                      <Toast.Header>
                        <h4>{notification.type}</h4>
                      </Toast.Header>
                      <Toast.Body>
                        {notification.message}
                      </Toast.Body>
                    </Toast.Dialog>
                  </div>
                  );
                })
              }
            </ol>
            : null
          }
        </div>
    )
  }
}