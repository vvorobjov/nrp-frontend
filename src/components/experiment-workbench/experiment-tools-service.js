import FlexLayout from 'flexlayout-react';
import DescriptionIcon from '@material-ui/icons/Description';
import ListAltIcon from '@material-ui/icons/ListAlt';
import OndemandVideoIcon from '@material-ui/icons/OndemandVideo';

import ExperimentWorkbenchService from './experiment-workbench-service';
import { Description } from '@material-ui/icons';
import NrpCoreDashboard from '../nrp-core-dashboard/nrp-core-dashboard';
import TransceiverFunctionEditor from '../tf-editor/tf-editor';

import TimelineIcon from '@material-ui/icons/Timeline';
import DataVisualizer from '../data-visualizer/data-visualizer';
import { Modal, Button, Accordion, Dropdown, DropdownButton, Card, Form } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import XpraView from '../xpra/xpra-view';
import { SIM_TOOL } from '../constants';

const appConfig = window.appConfig;


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
    this.registerToolConfig(XpraView.CONSTANTS.TOOL_CONFIG);
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentToolsService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  setFlexLayoutModel(model) {
    this.flexLayoutModel = model;
  }

  registerToolConfig(toolConfig) {
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
    else {
      console.error('tool config for "' + component + '" is missing a callback for creating a flex-layout window!');
    }
  }

  startToolDrag(toolConfig, layoutReference) {
    let instances = this.getComponentInstanceList(
      toolConfig.flexlayoutNode.component,
      layoutReference.current.previousModel);
    if (toolConfig.singleton && instances.length > 0) {
      layoutReference.current.doAction(FlexLayout.Actions.selectTab(instances[0].getId()));
    }
    else {
      layoutReference.current.addTabWithDragAndDrop(toolConfig.flexlayoutNode.name, toolConfig.flexlayoutNode);
    }
  }

  addTool(toolConfig, layoutReference) {
    let instances = this.getComponentInstanceList(
      toolConfig.flexlayoutNode.component,
      layoutReference.current.previousModel);
    if (toolConfig.singleton && instances.length > 0) {
      layoutReference.current.doAction(FlexLayout.Actions.selectTab(instances[0].getId()));
    }
    else {
      layoutReference.current.addTabToActiveTabSet(toolConfig.flexlayoutNode);
    }
  }

  getComponentInstanceList(flexLayoutComponent, flexLayoutModel) {
    let list = [];
    flexLayoutModel.visitNodes((node, level) => {
      if (node._attributes.component === flexLayoutComponent) {
        list.push(node);
      }
    });
    return list;
  }
}

ExperimentToolsService.CONSTANTS = Object.freeze({
  /*CATEGORY: {
    EXTERNAL_IFRAME: 'EXTERNAL_IFRAME',
    REACT_COMPONENT: 'REACT_COMPONENT'
  },
  TOOL_TYPE: {
    FLEXLAYOUT_TAB: 'flexlayout-tab',
    EXTERNAL_TAB: 'external-tab'
  }*/
});

ExperimentToolsService.TOOLS = Object.freeze({
  // NEST_DESKTOP: {
  //   singleton: true,
  //   type: ExperimentToolsService.CONSTANTS.TOOL_TYPE.FLEXLAYOUT_TAB,
  //   flexlayoutNode: {
  //     'name': 'NEST Desktop',
  //     'component': 'nest-desktop'
  //   },
  //   flexlayoutFactoryCb: () =>  {
  //     return <iframe src='http://localhost:8000' title='NEST Desktop' />;
  //   },
  //   getIcon: () => {
  //     return <div>
  //       <img src={'https://www.nest-simulator.org/wp-content/uploads/2015/03/nest_logo.png'}
  //         alt="NEST Desktop"
  //         style={{width: 40+ 'px', height: 20 + 'px'}} />
  //     </div>;
  //   }
  // },
  TEST_NRP_CORE_DOCU: {
    singleton: false,
    type: SIM_TOOL.TOOL_TYPE.FLEXLAYOUT_TAB,
    flexlayoutNode: {
      'name': 'NRP-Core Docs',
      'component': 'nrp-core-docu'
    },
    flexlayoutFactoryCb: () => {
      return <iframe src='https://hbpneurorobotics.bitbucket.io/index.html'
        title='NRP-Core Documentation' />;
    },
    getIcon: () => {
      return <DescriptionIcon/>;
    },
    isShown: () => {
      return true;
    }
  },
  /*XPRA_EXTERNAL_TAB: {
    singleton: true,
    type: ExperimentToolsService.CONSTANTS.TOOL_TYPE.EXTERNAL_TAB,
    flexlayoutNode: {
      'name': 'Xpra',
      'component': 'xpra-external'
    },
    getIcon: () => {
      return <div>
        <a href='http://localhost:9000/xpra/index.html' target='_blank' rel="noreferrer">
          <img src={'https://www.xpra.org/icons/xpra-logo.png'}
            alt="Xpra"
            style={{width: 40+ 'px', height: 20 + 'px'}} />
        </a>
      </div>;
    }
  },*/
  XPRA: {
    singleton: true,
    type: SIM_TOOL.TOOL_TYPE.FLEXLAYOUT_TAB,
    flexlayoutNode: {
      'name': 'Server Videostream (Xpra)',
      'component': 'xpra'
    },
    flexlayoutFactoryCb: () =>  {
      return <XpraView />;
    },
    getIcon: () => {
      return <OndemandVideoIcon />;
    },
    isShown: () => {
      const xpra = ExperimentWorkbenchService.instance.xpraUrls;
      return xpra && xpra.length > 0;
    }
  },
  TRANSCEIVER_FUNCTIONS_EDITOR: {
    singleton: true,
    type: SIM_TOOL.TOOL_TYPE.FLEXLAYOUT_TAB,
    flexlayoutNode: {
      'name': 'Edit experiment files',
      'component': 'TransceiverFunctionEditor'
    },
    flexlayoutFactoryCb: () => {
      return <TransceiverFunctionEditor />;
    },
    getIcon: () => {
      return <ListAltIcon/>;
    },
    isShown: () => {
      return true;
    }
  },
  NEST_DESKTOP: {
    singleton: true,
    type: SIM_TOOL.TOOL_TYPE.FLEXLAYOUT_TAB,
    flexlayoutNode: {
      'name': 'NEST Desktop',
      'component': 'nest-desktop'
    },
    flexlayoutFactoryCb: () =>  {
      return <iframe src={appConfig.nestDesktop.url} title='NEST Desktop' />;
    },
    getIcon: () => {
      return <div>
        <img src={'https://www.nest-simulator.org/wp-content/uploads/2015/03/nest_logo.png'}
          alt="NEST Desktop"
          style={{width: 40+ 'px', height: 20 + 'px'}} />
      </div>;
    },
    isShown: () => {
      return appConfig && appConfig.nestDesktop && appConfig.nestDesktop.enabled;
    }
  },
  DATA_VISUALIZER: {
    singleton: true,
    flexlayoutNode: {
      'type': 'tab',
      'name': 'Data Visualizer',
      'component': 'DataVisualizer'
    },
    flexlayoutFactoryCb: () =>  {
      return <DataVisualizer/>;
    },
    getIcon: () => {
      return <TimelineIcon/>;
    }
  }
});


export default ExperimentToolsService;
