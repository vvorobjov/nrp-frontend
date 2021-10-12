import React from 'react';

class Gz3dView extends React.Component {
  constructor(props) {
    super(props);

    this.refGz3dContainer = React.createRef();
  }

  async componentDidMount() {
    /*console.info(this.refGz3dContainer);
    console.info(global.GZ3D);
    console.info(window.GZ3D);
    this.gz3dRenderService = new global.GZ3D.RenderService(
      this.refGz3dContainer.current
    );
    this.gz3dRenderService.init();*/

    await this.loadScripts();
  }

  async loadScripts() {
    /*const script = document.createElement('script');
    script.src = 'node_modules/three/build/three.js';
    script.type = 'text/js';
    //script.id = 'googleMaps';
    document.body.appendChild(script);
    script.onload = () => {
      console.info(window.THREE);
    };*/

    let THREE = await import('node_modules/three/build/three.js');
    console.info(THREE);
  }

  render() {
    return <div ref={this.refGz3dContainer}></div>;
  }
}

export default Gz3dView;
