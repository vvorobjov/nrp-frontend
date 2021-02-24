let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of OIDC/FS authentication for NRP accounts
 */
class ErrorHandlerService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ErrorHandlerService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  displayServerHTTPError(error) {
    //TODO: needs proper UI implementation
    console.error(error);
  }

  onErrorSimulationUpdate(error) {
    //TODO: needs proper UI implementation
    console.error(error);
  }

  handleClose() {
    this.setState({
      open: false,
      isErrorSourceDisplayed: this.state.isErrorSourceDisplayed
    });
  }

  sourceDisplay() {
    this.setState({
      open: true,
      ErrorSourceDisplayed: !this.state.isErrorSourceDisplayed
    });
  }

  nrpErrorDialog(error){
    if (this.state.open){
      return (
        <Modal.Dialog>
          <Modal.Header>
            <h4>{error.type}</h4>
          </Modal.Header>
          <Modal.Body>
            <p>{error.message}</p>
          </Modal.Body>
          <Modal.Footer>
            <div>
              <Button variant="outline-dark" onClick={this.handleClose}>
                <span class="glyphicon glyphicon-remove"></span> Close
              </Button>
              <Button variant="outline-dark" className="pull-right" onClick={this.sourceDisplay}>
                {this.state.isErrorSourceDisplayed ? 'Hide' : 'Show'} scary details <span className="caret"></span>
              </Button>
            </div>
            {!this.state.isErrorSourceDisplayed
              ?<div>
                <h5>Error Type</h5><pre>{error.type}</pre>
                <h6>Error Code</h6><pre>{error.code}</pre>
                <h6>Message</h6><pre>{error.message}</pre>
                {error.data
                  ? <div><h6>Data</h6><pre>{error.data}</pre></div>
                  : null}
                <div><h6>Stack Trace</h6><pre>{error.stack}</pre></div>
              </div>
              : null
            }
          </Modal.Footer>
        </Modal.Dialog>
      );
    }
    else{
      return null;
    }
  }
}

export default ErrorHandlerService;
