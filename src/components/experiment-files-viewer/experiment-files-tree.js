import React from 'react';

import ExperimentsFilesRemoteEditService from '../../services/experiments/files/experiments-files-remote-edit-service';

import './experiment-files-viewer.css';

export default class ExperimentFilesTree extends React.Component {

  render() {
    let localExperimentSetup = this.props.experiment ?
      ExperimentsFilesRemoteEditService.instance.localSetups.get(this.props.experiment.id) : undefined;

    return (
      <div>
        {localExperimentSetup ?
          <ol className='experiment-files-list'>
            {localExperimentSetup.files.map(file => {
              return (
                <li key={file.name} className='nostyle experiments-li'>
                  <div>
                    {file.name}
                  </div>
                </li>
              );
            })}
          </ol>
          : <span style={{margin: '20px'}}>No local mirror of experiment files available.</span>
        }
      </div>
    );
  }
}
