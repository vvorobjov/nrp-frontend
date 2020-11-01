import React from "react";

import "./entry-page.css";

export default class EntryPage extends React.Component {
  render() {
    return (
      <div className="entry-page">
        <header className="entry-page-header">
          <div>HOME</div>
          <div>EXPERIMENTS</div>
          <div>
            <a href="https://neurorobotics.net/" target="_blank">
              NEUROROBOTICS.AI
            </a>
          </div>
        </header>

        <div className="entry-page-banner">
          <h1>
            NEUROROBOTICS <br /> PLATFORM
          </h1>
        </div>

        <div className="sidebar-left"></div>
        <div className="experiments-left">
          <p>image placeholder</p>
          <p>see full list of experiments</p>
        </div>
        <div className="experiments-right">
          <p>Most recent</p>
          <p>Experiment 1 Placeholder</p>
          <p>Experiment 2 Placeholder</p>
        </div>
        <div className="sidebar-right"></div>
      </div>
    );
  }
}
