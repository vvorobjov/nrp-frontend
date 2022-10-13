import NrpCoreDashboard from '../nrp-core-dashboard/nrp-core-dashboard';


let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling server resources for simulating experiments.
 */
class ExperimentToolsService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.tools = new Map();
    for (const toolEntry in ExperimentToolsService.TOOLS) {
      this.registerToolConfig(ExperimentToolsService.TOOLS[toolEntry]);
    }
    this.registerToolConfig(NrpCoreDashboard.CONSTANTS.TOOL_CONFIG);
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentToolsService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  registerToolConfig(toolConfig) {
    console.info('registerToolConfig');
    console.info(toolConfig);
    let id = toolConfig.flexlayoutNode.component;
    if (this.tools.has(id)) {
      console.warn('SimulationToolsService.registerToolConfig() - tool with ID ' + id + ' already exists');
      return;
    }

    this.tools.set(id, toolConfig);
  }

  flexlayoutNodeFactory(node) {
    var component = node.getComponent();

    let toolConfig = this.tools.get(component);
    if (toolConfig && toolConfig.flexlayoutFactoryCb) {
      return toolConfig.flexlayoutFactoryCb();
    }

    if (component === 'button') {
      return <button>{node.getName()}</button>;
    }
    else if (component === 'nest_wiki') {
      return <iframe src='https://en.wikipedia.org/wiki/NEST_(software)' title='nest_wiki'
        className='flexlayout-iframe'></iframe>;
    }
  }

  startToolDrag(flexlayoutNode, layoutReference) {
    layoutReference.current.addTabWithDragAndDrop(flexlayoutNode.name, flexlayoutNode);
  }
}

ExperimentToolsService.TOOLS = Object.freeze({
  NEST_DESKTOP: {
    singleton: true,
    flexlayoutNode: {
      'type': 'tab',
      'name': 'NEST Desktop',
      'component': 'nest-desktop'
    },
    flexlayoutFactoryCb: () =>  {
      return <iframe src='http://localhost:8000' title='NEST Desktop' />;
    },
    getIcon: () => {
      return <div>
        <img src={'https://www.nest-simulator.org/wp-content/uploads/2015/03/nest_logo.png'}
          alt="NEST Desktop"
          style={{width: 40+ 'px', height: 20 + 'px'}} />
        <span>Desktop</span>
      </div>;
    }
  },
  TEST_NRP_CORE_DOCU: {
    singleton: true,
    flexlayoutNode: {
      'type': 'tab',
      'name': 'NRP-Core Docs',
      'component': 'nrp-core-docu'
    },
    flexlayoutFactoryCb: () =>  {
      return <iframe src='https://hbpneurorobotics.bitbucket.io/index.html'
        title='NRP-Core Documentation' />;
    },
    getIcon: () => {
      return <span>NRP-Core Docs</span>;
    }
  }
});

ExperimentToolsService.CONSTANTS = Object.freeze({
  CATEGORY: {
    EXTERNAL_IFRAME: 'EXTERNAL_IFRAME',
    REACT_COMPONENT: 'REACT_COMPONENT'
  }
});

export default ExperimentToolsService;