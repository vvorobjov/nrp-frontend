import React from 'react';

import GZ3D from 'gz3d-nrp/build/gz3d.imports.js';

class Gz3dView extends React.Component {
  constructor(props) {
    super(props);

    this.refGz3dContainer = React.createRef();
  }

  async componentDidMount() {
    console.info(this.refGz3dContainer);
    //await import('gz3d-nrp/build/gz3d.modular.js');
    console.info(GZ3D);
    this.gz3dRenderService = new GZ3D.RenderService(this.refGz3dContainer.current);
  }

  render() {
    return (
      <div ref={this.refGz3dContainer}>
      </div>
    );
  }
}

export default Gz3dView;