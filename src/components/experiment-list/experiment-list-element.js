import React from "react";

export default class ExperimentListElement extends React.Component {
  render() {
    return (
      <div className="experiment-box">
        {this.props.experiment && this.props.experiment.id}
      </div>
    );
  }
}
