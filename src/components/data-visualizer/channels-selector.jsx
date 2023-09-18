import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import ChannelSelector from './channel-selector';

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
              <Button variant="danger" onClick={() => handleDeleteClick(channel.id)}>
                Delete
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