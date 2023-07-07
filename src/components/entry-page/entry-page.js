import React from 'react';

import NrpHeader from '../nrp-header/nrp-header.js';

import './entry-page.css';
import NrpCoreDashboard from '../nrp-core-dashboard/nrp-core-dashboard.js';
//import TransceiverFunctionEditor from '../tf-editor/tf-editor';

export default class EntryPage extends React.Component {
  render() {
    return (
      <div className='entry-page-wrapper'>
        <div className='entry-page-header'>
          <NrpHeader title1='NEUROROBOTICS' title2='PLATFORM' />
        </div >
        {/* <div className='sidebar-left'></div>
        <div className='experiments-left'>
          <img
            src={PlaceholderImage}
            alt='Experiment List'
            className='img-experiment-list'
          />
          <p>see the full list of experiments</p>
        </div>
        <div className='experiments-right'>
          <h3>Most recent</h3>
          <p>Experiment 1 Placeholder</p>
          <p>Experiment 2 Placeholder</p>
        </div>
        <div className='sidebar-right'></div>*/}
        {/* <div>
          <div><b>!!! NRP Core testing !!!</b></div>
        </div> */}
        <div className='nrp-core-dashboard sidebar-left'>
          <NrpCoreDashboard />
        </div >
        <iframe title='neurorobotics-news' className='nrp-news sidebar-right'
          src='https://neurorobotics.net/latest.html' />
        {/*<TransceiverFunctionEditor experimentId='mqtt_simple_1'/>*/}
      </div>
    );
  }
}
