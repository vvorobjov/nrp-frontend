import React from "react";
import timeDDHHMMSS from "../../app/scripts/common/filters/time-filter.js";

import "./experiment-list-element.css";

export default class ExperimentListElement extends React.Component {
  render() {
    const exp = this.props.experiment;
    const config = this.props.experiment.configuration;
    const pageState =this.props.pageState;
    return (
      <div className="list-entry-container left-right" style={{position:"relative"}}>
        <div className="list-entry-left" style={{position:"relative"}}>
          <img class="entity-thumbnail" src={exp.configuration.thumbnail} alt='' />
        </div>
        <div className="list-entry-middle list-entry-container up-down">
          <div className="list-entry-container left-right title-line">
            <div className="h4">
              {exp.configuration.name}
            </div>
            <br />
          </div>
          <div>
            {exp.configuration.description}
            <br/>
          </div>
          <div style={{position:"relative"}}>
            <i>
              Timeout:
              {timeDDHHMMSS(exp.configuration.timeout)}
              ({(exp.configuration.timeoutType==='simulation' ? 'simulation' : 'real')} time)
            </i> 
            <br />
            <i>
              Brain processes: {exp.configuration.brainProcesses}
            </i>
            <br />
            <div style={{display:"flex"}}>
              <i style={{marginTop: "4px"}}>Server status: </i>
              <i className={{serverIcon: 1}} title="Restricted."></i>
            </div>
          </div>
          <div  class="list-entry-buttons list-entry-container center" onClick={()=>{return exp.id === pageState.selected}}>
                    <div class="btn-group" role="group" >
                        {config.canLaunchExperiments && exp.availableServers.length > 0 &&
                        exp.configuration.experimentFile && exp.configuration.bibiConfSr
                       
                        ? <button analytics-on analytics-event="Launch" analytics-category="Experiment" 
                            onClick={()=>{return pageState.startingExperiment === exp.id }}
                            value = {exp.configuration.experimentFile && exp.configuration.bibiConfSrc}
                            disabled = {pageState.startingExperiment === exp.id || pageState.deletingExperiment}
                            class="btn btn-default" >
                            <i class="fa fa-plus"></i> Launch 
                        </button>

                        :<button canLaunchExp={config.canLaunchExperiments} serverLength={exp.joinableServers.length} class="btn btn-default disabled enable-tooltip"
                            title="Sorry, no available servers.">
                            <i class="fa fa-plus"></i> Launch
                        </button>
                        }
                        {/* Option to Launch in Single Process Mode */}
                        <button canLaunchExp={config.canLaunchExperiments} brainProcesse={exp.configuration.brainProcesses} serverLength={exp.joinableServers.length}
                            expFile = {exp.configuration.experimentFile} expBibi={exp.configuration.bibiConfSrc} expId={exp.id}
                            class="btn btn-default">
                            <i class="fa fa-plus"></i> Launch in Single Process Mode
                        </button>

                        <button analytics-on analytics-event="Launch Multiple Instances" analytics-category="Experiment" 
                            canLaunchExp={config.canLaunchExperiments}  serverLength={exp.joinableServers.length}
                            expFile = {exp.configuration.experimentFile} expBibi={exp.configuration.bibiConfSrc}  expId={exp.id}
                            class="btn btn-default" >
                            <i class="fa fa-layer-group"></i> Launch Multiple
                        </button>

                        <button analytics-on analytics-event="Delete" analytics-category="Experiment" 
                            canLaunchExp={config.canLaunchExperiments} jServerLength={exp.joinableServers.length}
                            class="btn btn-default">
                            <i class="fa fa-times"></i> Delete
                        </button>

                        {/* Records button */}
                        <button analytics-on analytics-event="ShowRecords" analytics-category="Experiment" canLaunchExp={config.canLaunchExperiments}
                            class="btn btn-default">
                            <i class="fa fa-sign-in"></i> Recordings »
                        </button>

                        {/* Export button */}
                        <button analytics-on analytics-event="ExportZip" analytics-category="Experiment" canLaunchExp={config.canLaunchExperiments}
                            class="btn btn-default">
                            <i class="fa fa-file-export"></i> Export
                        </button>

                        {/* Join button */}
                        <button analytics-on analytics-event="Join" analytics-category="Experiment" canLaunchExp={config.canLaunchExperiments} jServerLength={exp.joinableServers.length}
                            class="btn btn-default" >
                            <i class="fa fa-sign-in"></i> Simulations »
                        </button>

                        {/* Clone button */}
                        <button canCloneExp={config.canCloneExperiments} confStorage={exp.configuration.privateStorage} expFile={exp.configuration.experimentFile} expBibi={exp.configuration.bibiConfSrc}
                            analytics-on analytics-event="Clone" analytics-label="Collab"
                            analytics-value={exp.id} class="btn btn-default">
                            <i class="fa fa-pencil-alt"></i> Clone
                        </button>

                        {/* Files button */}
                        <button canLaunchExp={config.canLaunchExperiments} analytics-on analytics-event="Explorer"
                            analytics-label="Collab" expId={exp.id} class="btn btn-default" >

                            <i class="fa fa-list-alt"></i> Files
                        </button>
                        {/* Shared button */}
                        <button canLaunchExp={config.canLaunchExperiments} expId={exp.id} analytics-on analytics-event="Explorer" class="btn btn-default" analytics-label="Collab">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                      </div>
              </div>
        </div>
      </div>
    );
  }
}
