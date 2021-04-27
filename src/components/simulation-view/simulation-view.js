import React from 'react';
import FlexLayout from 'flexlayout-react';

import '../../../node_modules/flexlayout-react/style/light.css';

const jsonBaseLayout = {
  global: {},
  borders: [],
  layout:{
    'type': 'row',
    'weight': 100,
    'children': [
      {
        'type': 'tabset',
        'weight': 50,
        'selected': 0,
        'children': [
          {
            'type': 'tab',
            'name': 'FX',
            'component':'grid'
          }
        ]
      },
      {
        'type': 'tabset',
        'weight': 50,
        'selected': 0,
        'children': [
          {
            'type': 'tab',
            'name': 'FI',
            'component':'grid'
          }
        ]
      }
    ]
  }
};

export default class SimulationView extends React.Component {
  constructor(props) {
    super(props);
    console.info(this.state);
    console.info(this.props);

    this.state = {model: FlexLayout.Model.fromJson(jsonBaseLayout)};
    console.info(this.state);
  }

  factory = (node) => {
    var component = node.getComponent();
    if (component === 'button') {
      return <button>{node.getName()}</button>;
    }
  }

  render() {
    return (
      <div>
        <FlexLayout.Layout model={this.state.model} factory={this.factory}/>
      </div>
    );
  }
}
