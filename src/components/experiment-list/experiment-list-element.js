import React from 'react';
import timeDDHHMMSS from '../../app/scripts/common/filters/time-filter.js';

import './experiment-list-element.css';

export default class ExperimentListElement extends React.Component {
  render() {
    const exp = this.props.experiment;
    const config = this.props.experiment.configuration;
    const pageState =this.props.pageState;
    config.canLaunchExperiments = true;
    return (
      <div className='list-entry-container left-right' style={{position:'relative'}}>
        <div className='list-entry-left' style={{position:'relative'}}>
          <img className='entity-thumbnail' src={exp.configuration.thumbnail} alt='' />
        </div>
        <div className='list-entry-middle list-entry-container up-down'>
          <div className='list-entry-container left-right title-line'>
            <div className='h4'>
              {exp.configuration.name}
            </div>
            <br />
          </div>
          <div>
            {exp.configuration.description}
            <br/>
          </div>
          <div style={{position:'relative'}}>
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
            <div style={{display:'flex'}}>
              <i style={{marginTop: '4px'}}>Server status: </i>
              <i className={{serverIcon: 1}} title='Restricted.'></i>
            </div>
          </div>
          <div  className='list-entry-buttons list-entry-container center' onClick={()=>{
            return exp.id === pageState.selected
          }}>
            <div className='btn-group' role='group' >
              {config.canLaunchExperiments && exp.joinableServers.length > 0 &&
              exp.configuration.experimentFile && exp.configuration.bibiConfSr
                ? <button analytics-on analytics-event='Launch' analytics-category='Experiment'
                  onClick={()=>{
                    return pageState.startingExperiment === exp.id
                  }}
                  disabled = {pageState.startingExperiment === exp.id || pageState.deletingExperiment}
                  className='btn btn-default' >
                  <i className='fa fa-plus'></i> Launch
                </button>
                :null}

              {config.canLaunchExperiments && exp.joinableServers.length === 0
                ?<button className='btn btn-default disabled enable-tooltip'
                  title='Sorry, no available servers.'>
                  <i className='fa fa-plus'></i> Launch
                </button>
                : null}

              {config.canLaunchExperiments && config.brainProcesses > 1 && exp.joinableServers.length > 0 &&
              exp.configuration.experimentFile && exp.configuration.bibiConfSrc

                ? <button className='btn btn-default'>
                  <i className='fa fa-plus'></i> Launch in Single Process Mode
                </button>
                : null}

              {config.canLaunchExperiments && exp.joinableServers.length > 1 &&
                  exp.configuration.experimentFile && exp.configuration.bibiConfSrc

                ? <button analytics-on analytics-event='Launch Multiple Instances'
                  className='btn btn-default' >
                  <i className='fa fa-layer-group'></i> Launch Multiple
                </button>
                : null}

              {/* isPrivateExperiment */}
              {config.canLaunchExperiments
                ? <button analytics-on analytics-event='Delete' analytics-category='Experiment'
                  className='btn btn-default'>
                  <i className='fa fa-times'></i> Delete
                </button>
                : null}

              {/* Records button */}
              {config.canLaunchExperiments
                ? <button analytics-on analytics-event='ShowRecords' analytics-category='Experiment' canLaunchExp={config.canLaunchExperiments}
                  className='btn btn-default'>
                  <i className='fa fa-sign-in'></i> Recordings »
                </button>
                : null}

              {/* Export button */}
              {config.canLaunchExperiments
                ? <button analytics-on analytics-event='ExportZip' analytics-category='Experiment' canLaunchExp={config.canLaunchExperiments}
                  className='btn btn-default'>
                  <i className='fa fa-file-export'></i> Export
                </button>
                : null}

              {/* Join button */}
              {config.canLaunchExperiments && exp.joinableServers.length > 0
                ? <button analytics-on analytics-event='Join' analytics-category='Experiment' canLaunchExp={config.canLaunchExperiments} jServerLength={exp.joinableServers.length}
                  className='btn btn-default' >
                  <i className='fa fa-sign-in'></i> Simulations »
                </button>
                : null}

              {/* Clone button */}
              {config.canCloneExperiments && (!exp.configuration.privateStorage || (exp.configuration.experimentFile && exp.configuration.bibiConfSrc))
                ? <button analytics-on analytics-event='Clone' analytics-label='Collab'
                  analytics-value={exp.id} className='btn btn-default'>
                  <i className='fa fa-pencil-alt'></i> Clone
                </button>
                : null}

              {/* Files button */}
              {config.canLaunchExperiments
                ? <button canLaunchExp={config.canLaunchExperiments} analytics-on analytics-event='Explorer'
                  analytics-label='Collab' expId={exp.id} className='btn btn-default' >

                  <i className='fa fa-list-alt'></i> Files
                </button>
                : null}

              {/* Shared button */}
              {config.canLaunchExperiments
                ? <button canLaunchExp={config.canLaunchExperiments} expId={exp.id} analytics-on analytics-event='Explorer' className='btn btn-default' analytics-label='Collab'>
                  <i className='fas fa-share-alt'></i> Share
                </button>
                : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
