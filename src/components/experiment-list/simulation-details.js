import React from 'react';

import timeDDHHMMSS from '../../utility/time-filter.js';

export default class SimulationDetails extends React.Component {
  render() {
    return (
      <div className='experiment-list-wrapper'>
        <div className="table-wrapper"
          /*uib-collapse="!config.canLaunchExperiments ||
            (pageState.selected != exp.id)||(!pageState.showJoin && !running) || !exp.joinableServers.length"*/>
          <table className="table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Creator</th>
                <th>Uptime</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {this.props.simulations.map(simulation => {
                return (
                  <tr>
                    <td>{simulation.server}</td>
                    <td>{simulation.owner}</td>
                    <td className="monospace-text">{timeDDHHMMSS(simulation.uptime)}</td>
                    <td>{simulation.runningSimulation.state}</td>
                    <td>
                      {/* Join button enabled provided simulation state is consistent*/}
                      <button /*analytics-on analytics-event="Join" analytics-category="Experiment"*/
                        ng-click="(simulation.runningSimulation.state === STATE.CREATED) ||
                      simulation.stopping || joinExperiment(simulation, exp);"
                        type="button" className="btn btn-default"
                        ng-disabled="(simulation.runningSimulation.state === STATE.CREATED) ||
                      simulation.stopping">
                        Join »</button>
                      {/* Stop button enabled provided simulation state is consistent*/}
                      <button /*analytics-on analytics-event="Stop" analytics-category="Experiment"*/
                        ng-click="stopSimulation(simulation, exp);"
                        type="button" className="btn btn-default"
                        ng-if="canStopSimulation(simulation)"
                        ng-disabled="simulation.stopping">
                        <i className="fa fa-spinner fa-spin" ng-if="simulation.stopping"></i> Stop
                      </button>
                      {/*No edit rights: stop button disabled */}
                      <button type="button" className="btn btn-default disabled enable-tooltip"
                        title="Sorry, you don't have sufficient rights to stop the simulation."
                        ng-if="!canStopSimulation(simulation)"> Stop
                      </button>
                    </td>
                  </tr>
                );
              }
              )}
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  {/* Stop all button enabled provided simulation state is consistent*/}
                  <button /*analytics-on analytics-event="Stop All" analytics-category="Experiment"*/
                    ng-click="stopAllthis.props.simulationsations(exp)"
                    type="button" className="btn btn-default" ng-if="canStopAllSimulations(exp)"
                    ng-disabled="!canStopAllSimulations(exp)">
                    <i className="fa fa-spinner fa-spin" ng-if=""></i> Stop All
                  </button>
                  {/* No edit rights: stop all button disabled */}
                  <button type="button" className="btn btn-default disabled enable-tooltip"
                    title="Sorry, you don't have sufficient rights to stop the this.props.simulationsations."
                    ng-if="!canStopAllSimulations(exp)"> Stop All
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
