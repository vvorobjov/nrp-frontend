import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

/**
 * Compatibility shim for react-router v5's `withRouter` HOC, which was removed
 * in react-router v6. It injects the v6 router hooks as props so existing class
 * components keep working without being rewritten as function components.
 *
 * Injected props:
 *   - `navigate` — replaces the old `history` object:
 *       history.push(path)        -> navigate(path)
 *       history.replace(path)     -> navigate(path, { replace: true })
 *       history.goBack()          -> navigate(-1)
 *   - `location` — same shape as before (from `useLocation`)
 *   - `params` — route params (from `useParams`, was `match.params` in v5)
 *
 * @param {React.ComponentType} Component the component to wrap
 * @returns {React.ComponentType} the wrapped component receiving router props
 */
export default function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    return (
      <Component
        {...props}
        navigate={navigate}
        location={location}
        params={params}
      />
    );
  }
  return ComponentWithRouterProp;
}
