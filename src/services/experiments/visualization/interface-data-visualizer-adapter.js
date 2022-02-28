export default class IDataVisualizerAdapter {
  static get instance() {
    throw new Error('overwrite interface methods!');
  };

  connect() {
    throw new Error('overwrite interface methods!');
  }

  async updateDataSources() {
    throw new Error('overwrite interface methods!');
  }

  subscribeTopics() {
    throw new Error('overwrite interface methods!');
  }

  unsubscribeTopics() {
    throw new Error('overwrite interface methods!');
  }
}