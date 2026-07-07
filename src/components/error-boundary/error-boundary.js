import React from 'react';
import PropTypes from 'prop-types';

import './error-boundary.css';

/**
 * Top-level React error boundary.
 *
 * Catches render/lifecycle errors thrown anywhere in the child tree and shows a
 * friendly fallback instead of leaving the user with a blank white SPA. Without
 * it, a single uncaught throw during render unmounts the whole application and
 * nothing is displayed.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error) {
    // Render the fallback UI on the next render.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep the details in the console for debugging; the UI stays friendly.
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary-fallback'>
          <h1>Something went wrong.</h1>
          <p>
            The Neurorobotics Platform frontend hit an unexpected error and could
            not render this view.
          </p>
          {this.state.error && this.state.error.message
            ? <pre className='error-boundary-message'>{this.state.error.message}</pre>
            : null}
          <button
            className='error-boundary-reload'
            onClick={() => this.handleReload()}
          >
            Reload the application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node
};
