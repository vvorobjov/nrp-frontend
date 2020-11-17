import React from "react";
import { Link } from "react-router-dom";

import UserMenu from "../user-menu/user-menu.js";

import "./entry-page.css";
import PlaceholderImage from "../../assets/images/Artificial_Intelligence_2.jpg";

export default class EntryPage extends React.Component {
  render() {
    return (
      <div className="entry-page">
        <header className="entry-page-header">
          <div>
            <Link to="/">HOME</Link>
          </div>
          <div>
            <Link to="/experiments-overview">EXPERIMENTS</Link>
          </div>
          <a
            href="https://neurorobotics.net/"
            target="_blank"
            rel="noreferrer"
            className="header-link"
          >
            NEUROROBOTICS.AI
          </a>
          <UserMenu />
        </header>

        <div className="entry-page-banner">
          <h1>
            NEUROROBOTICS <br /> PLATFORM
          </h1>
        </div>

        <div className="sidebar-left"></div>
        <div className="experiments-left">
          <img
            src={PlaceholderImage}
            alt="Experiment List"
            className="img-experiment-list"
          />
          <p>see the full list of experiments</p>
        </div>
        <div className="experiments-right">
          <h3>Most recent</h3>
          <p>Experiment 1 Placeholder</p>
          <p>Experiment 2 Placeholder</p>
        </div>
        <div className="sidebar-right"></div>
      </div>
    );
  }
}
