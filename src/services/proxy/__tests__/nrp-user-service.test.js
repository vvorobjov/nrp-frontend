/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import NrpUserService from '../../../services/proxy/nrp-user-service';

import MockUserGroups from '../../../mocks/mock_user-groups.json';

afterEach(() => {
  jest.restoreAllMocks();
});

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new NrpUserService();
  }).toThrow(Error);
  expect(() => {
    new NrpUserService();
  }).toThrowError(Error('Use NrpUserService.instance'));
});

test('the experiments service instance always refers to the same object', () => {
  const instance1 = NrpUserService.instance;
  const instance2 = NrpUserService.instance;
  expect(instance1).toBe(instance2);
});

test('can get a user for a given ID', async () => {
  let user = await NrpUserService.instance.getUser('test-id');
  expect(user.id).toBeDefined();
  expect(user.displayName).toBeDefined();
});

test('can get a user name for a given ID', async () => {
  let userName = await NrpUserService.instance.getUserName('test-id');
  expect(userName).toBeDefined();

  // getUser returns an error
  jest.spyOn(NrpUserService.instance, 'getUser').mockImplementation(() => {
    return Promise.reject();
  });
  userName = await NrpUserService.instance.getUserName('test-id');
  expect(userName).toBe('Unknown');
});

test('can get the current user', async () => {
  let user = await NrpUserService.instance.getCurrentUser();
  expect(user.id).toBeDefined();
  expect(user.displayName).toBeDefined();
});

test('can get the current user groups', async () => {
  let groups = await NrpUserService.instance.getCurrentUserGroups();
  expect(groups).toBeDefined();
});

test('can determine group membership', async () => {
  expect(await NrpUserService.instance.isGroupMember(MockUserGroups[0].name)).toBe(true);
  expect(await NrpUserService.instance.isGroupMember('not-a-group')).toBe(false);
});

test('can determine group membership for cluster reservation', async () => {
  expect(await NrpUserService.instance.isMemberOfClusterReservationGroup()).toBe(false);
});

test('can determine group membership for administrators', async () => {
  expect(await NrpUserService.instance.isAdministrator()).toBe(true);
});

test('can retrieve cluster reservations', async () => {
  expect(await NrpUserService.instance.getReservation()).toBe(null);
});