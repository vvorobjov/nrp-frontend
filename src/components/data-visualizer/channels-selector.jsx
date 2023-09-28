import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import ChannelSelector from './channel-selector';


/**
 * Generates the elements for setting up the detailed properties of the graph.
 * @param {} - nothing
 * @returns {JSX} ChannelsSelector - JSX Element with interface for addig or removing multiple ChanelSelector Components
 */
const ChannelsSelector = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  const handleCheckboxChange = (channelId) => {
    if (selectedChannels.includes(channelId)) {
      setSelectedChannels(selectedChannels.filter((id) => id !== channelId));
    }
    else {
      setSelectedChannels([...selectedChannels, channelId]);
    }
  };

  const handleDeleteClick = (channelId) => {
    const updatedChannels = channels.filter((channel) => channel.id !== channelId);
    setChannels(updatedChannels);
    setSelectedChannels(selectedChannels.filter((id) => id !== channelId));
  };

  const handleAddClick = () => {
    const newChannelId = channels.length + 1;
    const newChannel = {
      id: newChannelId,
      name: `Channel ${newChannelId}`
    };
    setChannels([...channels, newChannel]);
  };

  return (
    <div>
      <ul>
        {channels.map((channel) => {
          return (
            <li key={channel.id}>
              <input
                type="checkbox"
                checked={selectedChannels.includes(channel.id)}
                onChange={() => handleCheckboxChange(channel.id)}
              />
              {channel.name}
              <ChannelSelector />
              <Button variant="secondary" onClick={() => handleDeleteClick(channel.id)}>
                X  Delete channel and remove it from plot
              </Button>
            </li>
          );
        })}
      </ul>
      <Button variant="primary" onClick={handleAddClick}>
        Add Channel
      </Button>
    </div>
  );
};

export default ChannelsSelector;
