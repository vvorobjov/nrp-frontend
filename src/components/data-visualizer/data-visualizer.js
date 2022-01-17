import React from 'react';
import Plot from 'react-plotly.js';
import * as THREE from 'three';
import ChartBasic from '../../assets/images/data-visualizer/basic_chart.png';
import ChartLine from '../../assets/images/data-visualizer/line_chart.png';
import ChartPie from '../../assets/images/data-visualizer/pie_chart.png';
import PlotScatter from '../../assets/images/data-visualizer/scatter_plot.png';
import ChartBar from '../../assets/images/data-visualizer/bar_chart.png';
import AreaFilled from '../../assets/images/data-visualizer/filled_area.png';
import ChartBubble from '../../assets/images/data-visualizer/bubble_chart.png';
import ChartStatistical from '../../assets/images/data-visualizer/statistical_chart.png';
import BarError from '../../assets/images/data-visualizer/error_bar.png';
import Chart3d from '../../assets/images/data-visualizer/3d_chart.png';
import Scatter3d from '../../assets/images/data-visualizer/scatter_3d.png';

import './data-visualizer.css';
import '../main.css';

import DataVisualizerService from '../../services/experiments/visualization/data-visualizer-service';
import RunningSimulationService from '../../services/experiments//execution/running-simulation-service';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';

const TYPES = [
  {
    title: 'Basic',
    thumbnail: ChartBasic,
    models: [
      {
        title: 'Line',
        thumbnail: ChartLine,
        dimensions: 2,
        multi: true, // We can add several lines
        hasAxis: true,
        type: 'scatter',
        mode: 'lines'
      },
      {
        title: 'Pie',
        thumbnail: ChartPie,
        dimensions: 1,
        multi: true,
        hasAxis: false,
        type: 'pie',
        mergedDimensions: true,
        positiveData: true
      },
      {
        title: 'Scatter',
        thumbnail: PlotScatter,
        dimensions: 2,
        multi: false,
        hasAxis: true,
        type: 'scatter',
        mode: 'markers'
      },
      {
        title: 'Bar',
        thumbnail: ChartBar,
        dimensions: 1,
        multi: true,
        hasAxis: false,
        type: 'bar',
        mergedDimensions: true,
        mergedDimensionsUseXY: true
      },
      {
        title: 'Filled Areas',
        thumbnail: AreaFilled,
        dimensions: 2,
        multi: true,
        hasAxis: true,
        type: 'scatter',
        fill: 'tozeroy'
      },
      {
        title: 'Bubbles',
        thumbnail: ChartBubble,
        dimensions: 3,
        multi: true,
        hasAxis: true,
        type: 'scatter',
        mode: 'markers',
        lastDimensionIsSize: true
      }
    ]
  },
  {
    title: 'Stastical',
    thumbnail: ChartStatistical,
    models: [
      {
        title: 'Error Bars',
        thumbnail: BarError,
        dimensions: 3,
        multi: true,
        hasAxis: true,
        type: 'scatter',
        mode: 'lines',
        lastDimensionIsYError: true
      }
    ]
  },
  {
    title: '3D',
    thumbnail: Chart3d,
    models: [
      {
        title: 'Scatter 3D',
        thumbnail: Scatter3d,
        dimensions: 3,
        multi: true,
        hasAxis: true,
        type: 'scatter3d',
        mode: 'markers'
      }
    ]
  }
];

export default class DataVisualizer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlotVisible: false,
      isStructureVisible: false,
      config: {},
      data: [],
      revision: 0,
      plotModel: [],
      layout: null,
      types: this.createModelsTypes(TYPES),
      axisLabels: [],
      plotStructure: [],
      sortedSources: []
      // these don't seem to be reactive elements
      //message: {},
      //topics: [],
      //modelStateLastTime: undefined,
      //maxPoints: 500,
      //modelStateUpdateRate: 0.1,
      //keyContext: undefined,
      //container: undefined,
    };

    this.message = {}; //TODO: is this even necessary to save?
    //this.topics = []; //TODO: is this even necessary to save?
    this.modelStateLastTime = undefined;
    this.modelStateUpdateRate = 0.1;
    this.maxPoints = 500;
    this.keyContext = undefined;
    this.container = undefined;

    this.intervalTriggerPlotUpdate = null;
  }

  async componentDidMount() {
    /*this.setState({
      container: document.getElementsByClassName('plot')
      keyContext: this.findKeyContext(document, 'plotid')
    });*/
    this.container = document.getElementsByClassName('plot');
    this.keyContext = this.findKeyContext(document, 'plotid');

    this.parseStandardMessage = this.parseStandardMessage.bind(this);
    DataVisualizerService.instance.addListener(
      DataVisualizerService.EVENTS.STANDARD_MESSAGE, this.parseStandardMessage
    );

    //ROS specific function
    this.parseStateMessage = this.parseStateMessage.bind(this);
    DataVisualizerService.instance.addListener(
      DataVisualizerService.EVENTS.STATE_MESSAGE, this.parseStateMessage
    );

    this.loadSettings = this.loadSettings.bind(this);
    DataVisualizerService.instance.addListener(
      DataVisualizerService.EVENTS.SETTINGS, this.loadSettings
    );

    this.saveSortedSources = this.saveSortedSources.bind(this);
    DataVisualizerService.instance.addListener(
      DataVisualizerService.EVENTS.SORTED_SOURCES, this.saveSortedSources
    );

    //TODO: remove needPlotUpdate and revision from state?
    this.intervalTriggerPlotUpdate = setInterval(() => {
      if (this.state.needPlotUpdate) {
        this.setState({ needPlotUpdate: false, revision: this.state.revision++ });
      }
    }, DataVisualizerService.CONSTANTS.PLOT_UPDATE_INTERVAL_DEFAULT_MS);
  }

  componentWillUnmount() {
    DataVisualizerService.instance.removeListener(
      DataVisualizerService.EVENTS.STANDARD_MESSAGE, this.parseStandardMessage
    );

    //ROS specific function
    DataVisualizerService.instance.removeListener(
      DataVisualizerService.EVENTS.STATE_MESSAGE, this.parseStateMessage
    );

    DataVisualizerService.instance.removeListener(
      DataVisualizerService.EVENTS.SETTINGS, this.loadSettings
    );

    DataVisualizerService.instance.removeListener(
      DataVisualizerService.EVENTS.SORTED_SOURCES, this.saveSortedSources
    );

    this.intervalTriggerPlotUpdate && clearInterval(this.intervalTriggerPlotUpdate);
  }

  createModelsTypes(types) {
    for (let i = 0; i < types.length; i++) {
      types[i].visible = i === 0;
      types[i].colorMode = 'default';
      types[i].color = {};
      types[i].color.default = 'hsl(' + (10 + i / (types.length + 1) * 360.0) + ',95%,87%)';
    }
    return types;
  }

  saveSortedSources(sortedSources) {
    console.info('saveSortedSources');
    this.setState({ sortedSources: sortedSources });
  }

  loadSettings(settings) {
    console.info('loadSettings');
    DataVisualizerService.instance.setKey(this.keyContext);
    if (!settings.plottingToolsData || this.keyContext in settings.plottingToolsData) {
      return;
    }
    this.settings = settings.plottingToolsData[this.keyContext];
    this.setState({
      isStructureVisible: settings.structureSetupVisible,
      isPlotVisible: settings.plotVisible,
      axisLabels: settings.axisLabels,
      plotModel: settings.plotModel,
      plotStructure: settings.plotStructure
    });
    if (this.state.isPlotVisible) {
      this.showPlot(true);
    }
    else if (this.state.isStructureVisible) {
      this.showStructure(this.state.plotModel);
    }
  }

  findKeyContext(base, rootKey) {
    if (!base.parentElement || base.parentElement.id === 'simulation-view-mainview') {
      return rootKey;
    }
    let parentChildren = base.parentElement.children;
    let index = -1;
    for (let i = 0; i < parentChildren.length; i++) {
      if (parentChildren[1] === base) {
        index = 1;
        break;
      }
    }
    rootKey += '';
    rootKey += index;
    return this.findKeyContext(base.parentElement, rootKey);
  }

  //ROS specific function
  parseStateMessage(response) {
    /*this.setState({
      message: response.message,
      topics: response.topics
    });*/
    this.message = response.message;
    //this.topics = response.topics;

    let currentTime = Date.now() / 1000.0;
    if (
      this.modelStateLastTime !== undefined &&
      currentTime - this.modelStateLastTime < this.modelStateUpdateRate
    ) {
      return;
    }
    //this.setState({ modelStateLastTime: currentTime });
    this.modelStateLastTime = currentTime;

    let needUpdateTime = false;
    if (this.state.data === null) {
      return;
    }
    for (let i = 0; i < this.state.plotStructure.plotElements.length; i++) {
      let dataElement = this.state.plotModel.mergedDimensions
        ? this.state.data[0]
        : this.state.data[i];
      for (
        let dim = 0;
        dim < this.state.plotStructure.plotElements[i].dimensions.length;
        dim++
      ) {
        let dimension = this.state.plotStructure.plotElements[i].dimensions[dim];
        // is 'gazebo_msgs/Model/States' spelled incorrectly? topic or topic type? 'gazebo_msgs/ModelStates'?
        if (response.topics[dimension.source] === 'gazebo_msgs/Model/States') {
          //Search a message that matches (if any)
          for (let j = 0; j < response.message.name.length; j++) {
            if (dimension.source.startWith('/' + response.message.name[j])) {
              let addData = false;
              let data = 0;
              if (dimension.source.startWith('/' + response.message.name[j] + '/model_state/position')) {
                addData = true;
                if (dimension.source.endWith('.x')) {
                  data = response.message.pose[j].position.x;
                }
                else if (dimension.source.endsWith('.y')) {
                  data = response.message.pose[j].position.y;
                }
                else if (dimension.source.endsWith('.z')) {
                  data = response.message.pose[j].position.z;
                }
                else if (dimension.source.startWith('/' + response.message.name[j] + '/model_state/angle')) {
                  let q = new THREE.Quaternion(
                    response.message.pose[j].orientation.x,
                    response.message.pose[j].orientation.y,
                    response.message.pose[j].orientation.z,
                    response.message.pose[j].orientation.w
                  );
                  let euler = new THREE.Euler();
                  euler.setFromQuaternion(q, 'XYZ');
                  addData = true;
                  if (dimension.source.endsWith('.x')) {
                    data = euler.x;
                  }
                  else if (dimension.source.endsWith('.y')) {
                    data = euler.y;
                  }
                  else if (dimension.source.endsWith('.z')) {
                    data = euler.z;
                  }
                }
                if (addData) {
                  this.setState({ needPlotUpdate: true });
                  needUpdateTime = true;
                  this.addDataToDimension(i, dim, dataElement, data);
                }
                break;
              }
            }
          }
        }
      }
    }
    if (needUpdateTime) {
      this.addTimePoint();
    }
  }

  parseStandardMessage(response) {
    //TODO: needs to parse multiple messages at once so it doesn't create multiple time entries
    let needUpdateTime = false;
    if (this.state.data === null) {
      return;
    }

    for (let i = 0; i < this.state.plotStructure.plotElements.length; i++) {
      let dataElement = this.state.plotModel.mergedDimensions
        ? this.state.data[0]
        : this.state.data[i];
      for (let dim = 0; dim < this.state.plotStructure.plotElements[i].dimensions.length; dim++) {
        let dimension = this.state.plotStructure.plotElements[i].dimensions[dim];
        if (dimension.source === response.message.name) {
          this.setState({ needPlotUpdate: true });
          this.addDataToDimension(i, dim, dataElement, response.message.data);
          needUpdateTime = true;
        }
      }
    }

    if (needUpdateTime) {
      this.addTimePoint();

      //TODO: debug
      if (!this.firstStandardMessageParsedWithNewData) {
        this.firstStandardMessageParsedWithNewData = true;

        console.info('parseStandardMessage with time update');
      }
    }

    //TODO: debug
    if (!this.firstStandardMessageParsed) {
      this.firstStandardMessageParsed = true;

      console.info('parseStandardMessage');
      console.info('response');
      console.info(response);
      console.info('this.state');
      console.info(this.state);
    }
  }

  addDataToDimension(index, dataIndex, dataElement, data) {
    //TODO: debug
    if (!this.firstAddDataToDimension) {
      this.firstAddDataToDimension = true;

      console.info('addDataToDimension(index, dataIndex, dataElement, data)');
      console.info([index, dataIndex, dataElement, data]);
    }

    let plotData;
    if (this.state.plotModel.positiveData) {
      data = data < 0 ? -data : data;
    }
    if (this.state.plotModel.mergedDimensions) {
      if (this.state.plotModel.mergedDimensionsUseXY) {
        plotData = dataElement.y.slice(0);
        plotData[index] = data;
        dataElement.data = plotData;
      }
      else {
        plotData = dataElement.data.slice(0);
        plotData[index] = data;
        dataElement.data = plotData;
      }
    }
    else {
      switch(dataIndex) {
      default: // case 0
        plotData = dataElement.x.slice(0);
        plotData.push(data);
        if (plotData.length > this.maxPoints) {
          plotData.splice(0, plotData.length - this.maxPoints);
        }
        dataElement.x = plotData;
        break;

      case 1:
        plotData = dataElement.y.slice(0);
        plotData.push(data);
        if (plotData.length > this.maxPoints) {
          plotData.splice(0, plotData.length - this.maxPoints);
        }
        dataElement.y = plotData;
        break;

      case 2:
        if (this.state.plotModel.lastDimensionIsSize) {
          plotData = dataElement.marker.size.slice(0);
        }
        else if (this.state.plotModel.lastDimensionIsYError) {
          plotData = dataElement.error_y.array.slice(0);
        }
        else {
          plotData = dataElement.z.slice(0);
        }
        plotData.push(data);
        if (plotData.length > this.maxPoints) {
          plotData.splice(0, plotData.length - this.maxPoints);
        }
        if (this.state.plotModel.lastDimensionIsYError) {
          dataElement.error_y.array = plotData;
        }
        else {
          dataElement.z = plotData;
        }
        break;
      }
    }
  }

  addTimePoint() {
    for (let i = 0; i < this.state.plotStructure.plotElements.length; i++) {
      let dataElement = this.state.plotModel.mergedDimensions
        ? this.state.data[0]
        : this.state.data[i];
      for (let di = 0; di < this.state.plotStructure.plotElements[i].dimensions.length; di++) {
        let dimension = this.state.plotStructure.plotElements[i].dimensions[di];
        if (dimension.source === DataVisualizerService.CONSTANTS.PLOT_DIMENSION_NAME_TIME) {
          this.addDataToDimension(i, di, dataElement, RunningSimulationService.instance.simulationTime);
        }
      }
    }
  }

  async showStructure(model) {
    await DataVisualizerService.instance.loadSortedSources(this.props.serverURL,
      this.props.simulationID, this.props.serverConfig);
    let axisLabels = ['X', 'Y', 'Z'];
    while (model.dimensions < axisLabels.length) {
      /*this.setState(state => {
        return { axisLabels: state.axisLabels.slice(0, -1) };
      });*/
      axisLabels = axisLabels.slice(0, -1);
    }
    this.setState({
      isStructureVisible: true,
      axisLabels: axisLabels,
      plotModel: model,
      plotStructure: { axis: [], plotElements: [] }
    });
    this.addDefaultElement();
  }

  newPlot() {
    console.info('newPlot, state:');
    console.info(this.state);
    /*this.setState({
      isPlotVisible: false,
      isStructureVisible: false
    });*/
    this.setState( state => {
      let config = state.config;
      config.width = this.container.clientWidth < 280 ? 280 : this.container.clientWidth;
      config.height = this.container.clientHeight < 280 ? 280 : this.container.clientHeight;

      return {
        config: config,
        isPlotVisible: false,
        isStructureVisible: false
      };
    });
    DataVisualizerService.instance.unregisterPlot(this.keyContext);
  }

  showPlot(hasSettings) {
    DataVisualizerService.instance.unregisterPlot(this.keyContext);

    let layout = {
      title: 'NRP Data Visualizer',
      width: this.container.clientWidth < 280 ? 280 : this.container.clientWidth,
      height: this.container.clientHeight < 280 ? 280 : this.container.clientHeight
    };
    if (this.state.plotModel.hasAxis) {
      for (
        let axis = 0;
        axis < this.state.plotStructure.axis.length;
        axis ++
      ) {
        let axisTitle = {
          title: { text: this.state.plotStructure.axis[axis] }
        };
        switch (axis) {
        default: // case 0
          /*this.setState(state => {
            let layout = state.layout;
            layout.xaxis = axisTitle;
            return { layout: layout };
          });*/
          layout.xaxis = axisTitle;
          break;
        case 1:
          /*this.setState(state => {
            let layout = state.layout;
            layout.yaxis = axisTitle;
            return { layout: layout };
          });*/
          layout.yaxis = axisTitle;
          break;
        case 2:
          /*this.setState(state => {
            let layout = state.layout;
            layout.zaxis = axisTitle;
            return { layout: layout };
          });*/
          layout.zaxis = axisTitle;
          break;
        }
      }
    }

    let data = [];
    let newElement;
    for (
      let element = 0;
      element < this.state.plotStructure.plotElements.length;
      element ++
    ) {
      let label = this.state.plotStructure.plotElements[element].label;
      let plotModel = this.state.plotModel;
      if (plotModel.mergedDimensions) {
        if (element === 0) {
          newElement = {};
          newElement.type = plotModel.type;
          newElement.mode = plotModel.mode;
          if (plotModel.mergedDimensionsUseXY) {
            newElement.x = [label];
            newElement.y = [0.0];
          }
          else {
            newElement.data = [0.001];
            newElement.labels = [label];
          }
        }
        else {
          if (plotModel.mergedDimensionsUseXY) {
            newElement.x.data.push(label);
            newElement.y.push(0.0);
          }
          else {
            newElement.labels.push(label);
            newElement.data.push(0.001);
          }
        }
      }
      else {
        newElement = {};

        newElement.type = plotModel.type;
        newElement.mode = plotModel.mode;
        newElement.fill = plotModel.fill;
        if (label.lenght>0) {
          newElement.name = label;
          newElement.showlegend = true;
        }
        else {
          newElement.showlegend = false;
        }
        for (
          let dimension = 0;
          dimension < this.state.plotStructure.plotElements[element].dimensions.length;
          dimension++
        ) {
          // Empty data for now, will be updated by messages
          switch (dimension) {
          default: // case 0
            newElement.x = [];
            break;
          case 1:
            newElement.y = [];
            break;
          case 2:
            if(this.state.plotModel.lastDimensionIsSize) {
              newElement.marker = {
                type: 'data',
                size: [],
                visible: true
              };
            }
            else if (this.state.plotModel.lastDimensionIsYError){
              newElement.error_y = {
                type: 'data',
                array: [],
                visible: true
              };
            }
            else {
              newElement.z = [];
            }
            break;
          }
        }
        data.push(newElement);
      }
    }
    this.setState({
      isPlotVisible: true,
      isStructureVisible: false,
      layout: layout,
      data: data
    });
    //this.setState({ data: data });
    this.startListening();
    if (hasSettings) {
      DataVisualizerService.instance.saveSettings(
        this.keyContext, this.state.isStructureVisible, this.state.isPlotVisible,
        this.state.axisLabels, this.state.plotModel, this.state.plotStructure
      );
    }
    DataVisualizerService.instance.unregisterPlot(this.keyContext);
  }

  startListening() {
    this.stopListening();
    DataVisualizerService.instance.initializeConnection(this.state.plotStructure, this.props.serverConfig);
  }

  stopListening() {
    DataVisualizerService.instance.closeConnection();
  }

  addDefaultElement() {
    console.info('addDefaultElement');
    // OLD, seems like inflationary setState calls
    /*let minimalPlot = { label: '', dimensions: [] };
    for (let i = 0; i < this.state.plotModel.dimensions; i++) {
      this.setState(state => {
        minimalPlot.dimensions.push({ source: state.sortedSources[i] });
        return { plotStructure : { ...state.plotStructure, axis : [...state.plotStructure.axis, ''] } };
      });
    }
    this.setState(state => {
      return {
        plotStructure: { ...state.plotStructure, plotElements: [...state.plotStructure.plotElements, minimalPlot] }
      };
    });*/

    let minimalPlot = { label: '', dimensions: [] };
    for (let i = 0; i < this.state.plotModel.dimensions; i++) {
      minimalPlot.dimensions.push({ source: this.state.sortedSources[i] });
    }
    this.setState(state => {
      return {
        plotStructure: {
          ...state.plotStructure,
          axis: [...state.plotStructure.axis, ''],
          plotElements: [...state.plotStructure.plotElements, minimalPlot] }
      };
    });
  }

  removeElement(elementIndex) {
    this.setState(state => {
      state.plotStructure.plotElements.splice(elementIndex, 1);
      return { plotStructure: state.plotStructure };
    });
  }

  changeTypeVisible(typeIndex) {
    this.setState(state => {
      let types = state.types;
      types[typeIndex].visible = !types[typeIndex].visible;
      types[typeIndex].models.forEach((model, modelIndex) => {
        types[typeIndex].models[modelIndex].color = types[typeIndex].color.default;
      });
      return { types: types };
    } );
  }

  changeTypeColor(typeIndex, colorMode) {
    this.setState(state => {
      let types = [ ...state.types ];
      types[typeIndex].colorMode = colorMode;
      return { types: types };
    } );
  }

  changeAxis(labelIndex, axis) {
    this.setState(state => {
      let plotStructure = state.plotStructure;
      plotStructure.axis[labelIndex] = axis;
      return { plotStructure: plotStructure };
    });
  }

  changeLabel(elementIndex, label) {
    this.setState(state => {
      let plotStructure = state.plotStructure;
      plotStructure.plotElements[elementIndex].label = label;
      return { plotStructure: plotStructure };
    });
  }

  changeSource(elementIndex, dimensionIndex, source) {
    this.setState(state => {
      let plotStructure = state.plotStructure;
      plotStructure.plotElements[elementIndex].dimensions[dimensionIndex].source = source.target.value;
      return { plotStructure: plotStructure };
    });
  }

  async getSimulationState(serverURL, simulationID) {
    return await RunningSimulationService.instance.getState(serverURL, simulationID);
  }

  render() {
    return (
      // data visualizer = dv
      <div className="dv-container">
        {!this.state.isPlotVisible && !this.state.isStructureVisible ?
          <div className="dv-header">
            <h3>Data Visualizer</h3>
            <hr/>
            <div className="dv-toolbar">
              {this.state.types.map((type, typeIndex) => {
                let buttonStyle = {
                  backgroundColor: type.visible? type.color[type.colorMode]: '#eeeeee',
                  borderTopLeftRadius: typeIndex===0? '25px': '0px',
                  borderTopRightRadius: typeIndex===this.state.types.length-1? '25px': '0px'
                };
                return (
                  <div className="dv-button" key={typeIndex} style={buttonStyle}
                    onClick={() => this.changeTypeVisible(typeIndex)}
                    onMouseLeave={() => this.changeTypeColor(typeIndex, 'default')}>
                    <img className="dv-image" src={type.thumbnail} alt=""/>
                    <div className="dv-caption">{type.title}</div>
                  </div>);
              })}
            </div>
          </div>
          : null}
        {this.state.isPlotVisible && !this.state.isStructureVisible ?
          <div className="plot-title">
            <Plot id="plot"
              data={/*[]*/this.state.data}
              layout={/*null*/this.state.layout}
              config={/*{}*/this.state.config}
              revision={this.state.revision}
            />
            <div className="plot-button">
              <button className="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={() => this.newPlot()}>
                <div>New Plot</div>
              </button>
            </div>
          </div>
          : null}
        {this.state.isStructureVisible ?
          <div className="structure-container">
            <h3>Data Visualizer</h3>
            {this.state.plotModel.hasAxis ?
              <div className="axis-container">
                <div className="axis-title">Axis Labels</div>
                <div className="axis-labels">
                  {this.state.axisLabels.map((label, labelIndex) => {
                    return (
                      <div className="label-container" key={labelIndex}>
                        <div className="label-title">{label}</div>
                        <input required onChange={(axis) => this.changeAxis(labelIndex, axis)}/>
                      </div>);
                  })}
                </div>
              </div>
              : null}
            <div className="structure-title">Data Sources</div>
            <div className={this.state.plotModel.hasAxis? 'datasource-scroll': 'datasource-scroll-sm'}>
              {this.state.plotStructure.plotElements.map((element, elementIndex) => {
                return (
                  <div className="datasource-element" key={elementIndex}>
                    <div className="label-title">Label </div>
                    <input className="label-name" type="text" required
                      onChange={(label) => this.changeLabel(elementIndex, label)}/>
                    {element.dimensions.map((dimension, dimensionIndex) => {
                      return (
                        <div className="datasource-dimension" key={dimensionIndex}>
                          <div className="label-title">{this.state.axisLabels[dimensionIndex]}</div>
                          <select className="dimension-source"
                            onChange={(source) => this.changeSource(elementIndex, dimensionIndex, source)}
                            value={dimension.source}>
                            {this.state.sortedSources.map((source, sourceIndex) => {
                              return (
                                <option value={source} key={sourceIndex}>{source}</option>
                              );
                            })}
                          </select>
                        </div>);
                    })}
                    <div className="plot-remove">
                      <button className="nrp-btn btn-default btn-md small-icon-button"
                        onClick={() => this.removeElement(elementIndex)} title="Remove plot entry">
                        <div className="button-symbol">X</div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="plot-show">
              <button className="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={() => this.showPlot()} title="Add new plot entry">
                <div>Show Plot</div>
              </button>
              <button className="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={() => this.addDefaultElement()} title="Add new plot entry">
                <div>Add Data Source</div>
              </button>
              <button className="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={() => this.newPlot()} title="Choose another plot">
                <div>Back</div>
              </button>
            </div>
          </div>
          : null}
        {!this.state.isPlotVisible && !this.state.isStructureVisible ?
          <div className="model-list">
            { this.state.types.map((type, typeIndex) => {
              if (type.visible) {
                let titleStyle = {  backgroundColor: type.color['default'] };
                return type.models.map((model, modelIndex) => {
                  let borderStyle = { border: '2px solid ' + type.color['default'] };
                  return (
                    <li className="model-container" key={modelIndex.toString() + typeIndex.toString()}>
                      <div className="model-content" style={borderStyle} data-role="button"
                        onMouseDown={() => this.showStructure(model)}>
                        <div className="model-image">
                          <img className={
                            this.getSimulationState(this.props.serverURL, this.props.simulationID)
                              ===EXPERIMENT_STATE.INITIALIZED?
                              'image-disabled image-thumbnail': 'image-clickable image-thumbnail'}
                          src={model.thumbnail} alt={model.modelPath}/>
                        </div>
                        <div className="model-caption">
                          <div className="model-title" style={titleStyle}> {model.title}</div>
                        </div>
                      </div>
                    </li>
                  );
                });
              }
              else {
                return null;
              }
            })}
          </div>
          : null}
      </div>
    );
  }
}