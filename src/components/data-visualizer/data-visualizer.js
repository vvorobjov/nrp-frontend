import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';

import DataVisualizerService from '../../services/experiments/visualization/data-visualizer-service';

import './data-visualizer.js';
import '../main.css';
import ServerResourcesService from '../../services/experiments/execution/server-resources-service';

export default class DataVisualizer extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isPlotVisible: false,
      isStructureVisible: false,
      data: [],
      container: ReactDOM.findDOMNode(DataVisualizer).getElementsByClassName('plot-pane'),
      layout: null,
      hasAxis: false,
      modelStateLastTime: undefined,
      modelStateUpdateRate: 1.0 / 10.0,
      types: [
        {
          title: 'Basic',
          thumbnail: 'img/esv/plotting-tool/basic_chart.png',
          models: [
            {
              modelTitle: 'Line',
              thumbnail: 'img/esv/plotting-tool/line_charts.png',
              dimensions: 2,
              multi: true, // We can add several lines
              hasAxis: true,
              type: 'scatter',
              mode: 'lines'
            },
            {
              modelTitle: 'Pie',
              thumbnail: 'img/esv/plotting-tool/pie_charts.png',
              dimensions: 1,
              multi: true,
              hasAxis: false,
              type: 'pie',
              mergedDimensions: true,
              valuesMustBePositive: true
            },
            {
              modelTitle: 'Scatter',
              thumbnail: 'img/esv/plotting-tool/scatter_plots.png',
              dimensions: 2,
              multi: false,
              hasAxis: true,
              type: 'scatter',
              mode: 'markers'
            },
            {
              modelTitle: 'Bar',
              thumbnail: 'img/esv/plotting-tool/bar_charts.png',
              dimensions: 1,
              multi: true,
              hasAxis: false,
              type: 'bar',
              mergedDimensions: true,
              mergedDimensionsUseXY: true
            },
            {
              modelTitle: 'Fill Area',
              thumbnail: 'img/esv/plotting-tool/filled_area.png',
              dimensions: 2,
              multi: true,
              hasAxis: true,
              type: 'scatter',
              fill: 'tozeroy'
            },
            {
              modelTitle: 'Bubbles',
              thumbnail: 'img/esv/plotting-tool/bubble_chart.png',
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
          thumbnail: 'img/esv/plotting-tool/statistical_chart.png',
          models: [
            {
              modelTitle: 'Error Bars',
              thumbnail: 'img/esv/plotting-tool/error_bars.png',
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
          thumbnail: 'img/esv/plotting-tool/3d_charts.png',
          models: [
            {
              modelTitle: 'Scatter 3D',
              thumbnail: 'img/esv/plotting-tool/scatter3d.png',
              dimensions: 3,
              multi: true,
              hasAxis: true,
              type: 'scatter3d',
              mode: 'markers'
            }
          ]
        }
      ],
      axisLabels: [],
      plotStructure: [],
      sortedSources: [],
      visibleModels: [],
      assetsPath: ''
    };
  }

  async componentDidMount() {
    this.unregisterPlot = this.unregisterPlot.bind(this);

    this.parseStateMessage = this.parseStateMessage.bind(this);
    DataVisualizerService.instance.addListener(
      DataVisualizerService.EVENTS.STATE_MESSAGES, this.parseStateMessage
    );

    this.parseStandardMessage = this.parseStandardMessage.bind(this);
    DataVisualizerService.instance.addListener(
      DataVisualizerService.EVENTS.STANDARD_MESSAGE, this.parseStandardMessage
    );
  }

  componentWillUnmount() {
    DataVisualizerService.instance.removeListener(
      DataVisualizerService.EVENTS.STATE_MESSAGE, this.parseStateMessage
    );

    DataVisualizerService.instance.removeListener(
      DataVisualizerService.EVENTS.STANDARD_MESSAGE, this.parseStandardMessage
    );
  }

  loadSettings(settings) {
    let key = this.keyContext();
    this.setKey(key);
    if (!settings.plottingToolsData || key in settings.plottingToolsData ) {
      return;
    }
    this.settings = settings.plottingToolsData[key];
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
    else if (this.state.isStructure) {
      this.showStructure(this.state.plotModel);
    }
  }

  keyContext() {
    return this.findKeyContext(ReactDOM.findDOMNode(DataVisualizer), 'plotid');
  }

  findKeyContext(base, rootKey) {
    if (!base.parentElement || base.parentElement.id === '') {
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

  parseStateMessage(response) {
    let message = response.message;
    let topics = response.topics;
    let currentTime = Date.now() / 1000.0;
    if (
      this.state.modelStateLastTime !== undefined &&
      currentTime - this.state.modelStateLastTime < this.state.modelStateUpdateRate
    ) {
      return;
    }
    this.setState({ modelStateLastTime: currentTime });
    let needUpdateTime = false;
    if (this.state.data === null) {
      return;
    }
    for (let i = 0; i < this.state.plotStructure.plotElementslength; i++) {
      let dataElement = this.state.plotModel.mergedDimensions
        ? this.state.data[0]
        : this.state.data[1];
      for (
        let dim = 0;
        dim < this.state.plotStructure.plotElements[i].dimensions.length;
        dim++
      ) {
        let dimension = this.state.plotStructure.plotElements[i].dimensions[dim];
        if (topics[dimension.source] === 'gazebo_msgs/Model/States') {
          //Search a message that matches (if any)
          for (let j = 0; j < message.name.length; j++) {
            if (dimension.source.startWith('/' + message.name[j])) {
              let addValue = false;
              let value = 0;
              if (dimension.source.startWith('/' + message.name[j] + '/model_state/position')) {
                addValue = true;
                if (dimension.source.endWith('.x')) {
                  value = message.pose[j].position.x;
                }
                else if (dimension.source.endsWith('.y')) {
                  value = message.pose[j].position.y;
                }
                else if (dimension.source.endsWith('.z')) {
                  value = message.pose[j].position.z;
                }
                else if (dimension.source.startWith('/' + message.name[j] + '/model_state/angle')) {
                  let q = new THREE.Quaternion(
                    message.pose[j].orientation.x,
                    message.pose[j].orientation.y,
                    message.pose[j].orientation.z,
                    message.pose[j].orientation.w
                  );
                  let euler = new THREE.Euler();
                  euler.setFromQuaternion(q, 'XYZ');
                  addValue = true;
                  if (dimension.source.endsWith('.x')) {
                    value = euler.x;
                  }
                  else if (dimension.source.endsWith('.y')) {
                    value = euler.y;
                  }
                  else if (dimension.source.endsWith('.z')) {
                    value = euler.z;
                  }
                }
                if (addValue) {
                  this.setState({ needPlotUpdate: true});
                  needUpdateTime = true;
                  this.addValueToDimension(i, dim, dataElement, value);
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

  parseStandardMessage(message) {
    let needUpdateTime = false;
    if (this.state.data === null) {
      return;
    }
    for (let i = 0; i < this.state.plotStructure.plotElements.length; i++) {
      let dataElement = this.plotModel.mergedDimensions
        ? this.state.data[0]
        : this.state.data[1];
      for (let dim = 0; dim < this.state.plotStructure.plotElements[i].dimensions.length; dim++) {
        let dimension = this.state.plotStructure.plotElements[i].dimensions[dim];
        if (dimension.source === this.name) {
          this.addValueToDimension(i, dim, dataElement, message.data);
          this.setState({ needPlotUpdate: true });
          needUpdateTime = true;
        }
      }
    }
    if (needUpdateTime) {
      this.addTimePoint();
    }
  }

  showStructureSetup(model) {
    this.setState({
      isStructure: true,
      axisLabels: ['x', 'Y', 'Z'],
      plotModel: model,
      plotStructure: { axis: [], plotElements: [] }
    });
    ServerResourcesService.instance.getTopics(DataVisualizerService.instance.loadTopics);
    while (this.state.plotModel.dimensions < this.state.axisLabels.length) {
      this.state.axisLabels.pop();
    }
    this.addDefaultElement();
  }

  newPlot() {
    this.setState({
      isPlotVisible: false,
      isStructureVisible: false
    });
    if (this.unregisterPlot) {
      DataVisualizerService.instance.unregisterPlot(this.keyContext());
      this.unregisterPlot = null;
    }
  }

  showPlot(hasSettings) {
    if (this.unregisterPlot) {
      DataVisualizerService.instance.unregisterPlot(this.keyContext());
      this.unregisterPlot = null;
    }
    this.setState({
      isPlotVisible: true,
      isStructureVisible: false,
      layout: {
        title: 'NRP Data Visualizer',
        width: this.checkSize(this.state.layout.clientWidth),
        height: this.checkSize(this.state.layout.clientHeight)
      }
    });
    if (this.state.hasAxis) {
      for (
        let axis = 0;
        axis < this.state.plotStructure.axis.length;
        axis ++
      ) {
        let axisTitle = {
          title: { text: this.state.plotStructure.axis[axis] }
        };
        switch (axis) {
        case 0:
          this.setState(
            {...this.state.layout}.xaxis = axisTitle
          );
          break;
        case 1:
          this.setState(
            {...this.state.layout}.yaxis = axisTitle
          );
          break;
        default:
          this.setState(
            {...this.state.layout}.zaxis = axisTitle
          );
        }
      }
    }
    this.setState({ data: []} );
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
            newElement.values = [0.001];
            newElement.labels = [label];
          }
        }
        else {
          if (plotModel.mergedDimensionsUseXY) {
            newElement.x.values.push(label);
            newElement.y.push(0.0);
          }
          else {
            newElement.labels.push(label);
            newElement.values.push(0.001);
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
          //Empty values for now, will be updated by messages
          switch (dimension) {
          case 0:
            newElement.x = [];
            break;
          case 1:
            newElement.y = [];
            break;
          default:
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
        this.state.data.push(newElement);
      }
    }
    this.state.setState({
      plotly: DataVisualizer.instance.buildPlotly(
        this.state.container,
        this.state.data,
        this.state.layout
      )
    });
    this.startListening();
    if (hasSettings) {
      DataVisualizerService.instance.saveSettings(
        this.keyContext(), this.state.isStructureVisible, this.state.isPlotVisible,
        this.state.axisLabels, this.state.plotModel, this.state.plotStructure
      );
    }
    this.unregisterPlot = DataVisualizerService.instance.unregisterPlot;
  }

  checkSize(size) {
    return size < 280 ? 280 : size;
  }

  startListening() {
    this.stopListening();
    DataVisualizer.instance.initializeConnection(this.state.plotStructure);
  }

  stopListening() {
    DataVisualizer.instance.closeConnection();
  }

  addDefaultElement() {
    let minimalPlot = { label: '', dimensions: []};
    for (let i = 0; i < this.state.plotModel.dimensions; i++) {
      this.setState({ plotStructure: { ...this.state.plotStructure, axis : [...this.state.axis, '']}});
      minimalPlot.dimensions.push({ source: this.state.sortedSources[i]});
    }
    this.setState({
      plotStructure: {
        ...this.state.plotStructure,
        plotElements: [...this.state.plotStructure.plotElements, minimalPlot]}
    });
  }

  changeIsType(type) {
    type.visible = !type.visible;
    this.updateVisibleModels();
  }

  updateVisibleModels() {
    let visibleModels = [];
    for (let i = 0; i < this.state.types.length; i++) {
      let cat = this.state.types[i];
      if (cat.visible) {
        for (let j = 0; j < cat.models.length; i++) {
          cat.models[j].color = cat.color['default'];
          visibleModels.push(cat.models[j]);
        }
      }
    }
    this.setState({ visibleModels: visibleModels });
  }

  render() {
    return (
      <div class="dv-container">
        {!this.state.isPlotVisible && !this.state.isStructureVisible ?
          <div class="dv-header">
            <h3>Data Visualizer</h3>
            <hr/>
            <div class="dv-toolbar">
              {this.state.types.forEach((type, index) => {
                const buttonStyle = {
                  'background-color': type.isPlotVisible? type.color[type.colorMode]:
                    (type.colorMode==='mouseover'? '#ffffff': '#eeeeee'),
                  'border-top-left-radius': index===0? '25px': '0px',
                  'border-top-right-radius': index===type.length? '25px': '0px'
                };
                return (
                  <div class="dv-button" style={{buttonStyle}} onClick={this.changeIsType(type)}
                    onMouseDown={() => this.setState([...this.state.types][index].colorMode='mousedown')}
                    onMouseUp={() => this.setState([...this.state.types][index].colorMode='mouseup')}
                    onMouseOver={() => this.setState([...this.state.types][index].colorMode='mouseover')}
                    onMouseLeave={() => this.setState([...this.state.types][index].colorMode='default')}>
                    <img class="dv-image" src={type.thumbnail} alt=""/>
                    <div class="dv-caption">{this.state.types.title}</div>
                  </div>);
              })}
            </div>
          </div>
          : null}
        {this.state.isPlotVisible && this.state.isStructureVisible ?
          <div class="plot-title">
            <div class="plot-pane"/>
            <div class="plot-button">
              <button class="nrp-btn nrp-btn-small btn-default btn-md small-icon-button"
                onClick={this.newPlot()} v-pressable>
                <p>New Plot</p>
              </button>
            </div>
          </div>
          : null}
        {this.state.isStructureVisible ?
          <div class="structure-container">
            <h3>Plotting Tool</h3>
            {this.state.hasAxis ?
              <div class="axis-container">
                <div class="axis-title">Axis Labels</div>
                <div class="axis-labels">
                  {this.state.axisLabels.forEach(label => {
                    return (
                      <div class="label-container">
                        <div class="label-title">{label}</div>
                        <input type="text" onKeyDown={(event) => event.suppressKeyPress()} required
                          onChange={(index) => this.setState(this.state.plotStructure.axis[index])}></input>
                      </div>);
                  })}
                </div>
              </div>
              : null}
            <div class="structure-title">Data Sources</div>
            <div class={this.state.hasAxis? 'datasource-scroll': 'datasource-scroll-sm'}>
              {this.state.plotStructure.plotElements.forEach((index, element) => {
                return (
                  <div class="datasource-element">
                    <div class="label-title">Label</div>
                    <input type="text" onKeyDown={(event) => event.suppressKeyPress()} required
                      onChange={() => this.setState(element.label)}></input>
                    {this.element.dimensions.forEach((index_dim, dimension) => {
                      return (
                        <div class="datasource-dimension">
                          <div class="label-title">{this.state.axisLabels[index_dim]}</div>
                          <select class="dimension-source" onChange={() => this.setState(dimension.source)}
                            value={dimension.source}>
                            {this.state.sortedSources.forEach(source => {
                              return (
                                <option value={source}>{source}</option>
                              );
                            })}
                          </select>
                        </div>);
                    })}
                    <div class="plot-remove">
                      <button class="nrp-btn nrp-btn-small btn-default btn-md small-icon-button"
                        onClick={this.removeElement(index)} title="Remove plot entry" v-pressable>
                        <div class="button-symbol">X</div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div class="plot-show">
              <button class="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={this.showPlot()} title="Add new plot entry" v-pressable>
                <div>Show Plot</div>
              </button>
              <button class="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={this.addDefaultElement()} title="Add new plot entry" v-pressable>
                <div>Add Data Source</div>
              </button>
              <button class="nrp-btn nrp-btn-wide btn-default btn-md small-icon-button"
                onClick={this.newPlot()} title="Choose another plot" v-pressable>
                <div>Back</div>
              </button>
            </div>
          </div>
          : null}
        {!this.state.isPlotVisible && !this.state.isStructureVisible ?
          <div class="model-list">
            {this.state.visibleModels.forEach(model => {
              return (
                <li class="model-container">
                  <button class="model-content" id={'insert-entity-'+model.modelPath}
                    onMouseDown={this.showStructure(model)}>
                    <div class="model-image">
                      <img class={this.props.stateService.currentState===this.props.STATE.INITIALIZED?
                        'image-disabled image-thumbnail': 'image-clickable image-tumbnail'}
                      src={model.thumbnail? model.thumbnail:
                        this.state.assetsPath+'/'+model.modelPath+'/thumbnail.png'} alt={model.modelPath}/>
                    </div>
                    <div class="model-box">
                      <div class="model-title" style={{'background':model.color}}> {model.title}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </div>
          : null}
      </div>
    );
  }
}