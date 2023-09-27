import React from 'react';
import List from '@material-ui/core/List';
import Tooltip from '@material-ui/core/Tooltip';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import ExperimentToolsService from './experiment-tools-service';
import { SIM_TOOL } from '../constants';


export default class ExperimentTools extends React.Component {

  render() {
    return (
      <List>
        {
        // eslint-disable-next-line array-callback-return
          Array.from(ExperimentToolsService.instance.tools.values()).map((tool, index) => {
            if (typeof tool.isShown !== 'undefined' && tool.isShown()) {
              return (
                tool.type === SIM_TOOL.TOOL_TYPE.EXTERNAL_TAB ?
                  <ListItem button key={index}
                    disabled={typeof tool.isDisabled !== 'undefined' && tool.isDisabled()}>
                    <ListItemIcon >{tool.getIcon()}</ListItemIcon>
                    <ListItemText primary={tool.flexlayoutNode.name} />
                  </ListItem>
                  :
                  <ListItem button key={index}
                    disabled={typeof tool.isDisabled !== 'undefined' && tool.isDisabled()}
                    onMouseDown={() => {
                      ExperimentToolsService.instance.startToolDrag(
                        tool,
                        this.props.flexlayoutReference);
                    }}
                    onClick={() => {
                      ExperimentToolsService.instance.addTool(
                        tool,
                        this.props.flexlayoutReference);
                    }}
                  >
                    <Tooltip title={tool.flexlayoutNode.name} placement="right">
                      <ListItemIcon >{tool.getIcon()}</ListItemIcon>
                    </Tooltip>
                    <ListItemText primary={tool.flexlayoutNode.name} />
                  </ListItem>
              );
            }
          })}
      </List>
    );
  }
}