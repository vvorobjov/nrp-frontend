import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

import NrpUserService from "../../services/proxy/nrp-user-service.js";
import AuthenticationService from "../../services/authentication-service.js";

import "./user-menu.css";

export default class UserMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      user: null,
    };
  }

  componentDidMount() {
    this._userRequest = NrpUserService.getCurrentUser().then((currentUser) => {
      this._userRequest = null;
      this.setState(() => ({
        user: currentUser,
      }));
    });
  }

  componentWillUnmount() {
    if (this._userRequest) {
      this._userRequest.cancel();
    }
  }

  onClickLogout() {
    AuthenticationService.clearStoredToken();
    window.location.reload();
  }

  render() {
    return (
      <div className="user-menu-wrapper">
        <Dropdown>
          <Dropdown.Toggle
            className="dropdown-toggle"
            variant="success"
            id="dropdown-basic"
          >
            <FontAwesomeIcon icon={faUserCircle} className="user-icon" />
            <div className="user-name">
              {this.state.user ? this.state.user.displayName : "pending ..."}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="dropdown-menu">
            <Dropdown.Item
              className="dropdown-item"
              onClick={this.onClickLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="user-icon" />
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}
