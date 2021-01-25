import { rest } from 'msw';

import config from '../config.json';
import endpoints from '../services/proxy/data/endpoints';
import MockExperiments from './mock_experiments.json';
import MockAvailableServers from './mock_available-servers.json';

import ImageAI from '../assets/images/Artificial_Intelligence_2.jpg';

const availableServers = MockAvailableServers;
const experiments = MockExperiments;

const thumbnailURL = `${config.api.proxy.url}${endpoints.proxy.storage.url}` +
  `/${experiments[0].name}/${experiments[0].configuration.thumbnail}?byname=true`;
console.info(thumbnailURL);

export const handlers = [
  rest.get(`${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`, (req, res, ctx) => {
    console.info('experiments handler');
    return res(
      ctx.json(experiments)
    );
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.availableServers.url}`, (req, res, ctx) => {
    console.info('availableServers handler');
    return res(
      ctx.json(availableServers)
    );
  }),
  rest.get(thumbnailURL, (req, res, ctx) => {
    console.info('thumbnail request');
    return res(ctx.json(JSON.stringify({})/*new Blob(ImageAI, {type: 'image/jpg'})*/));
  })
];