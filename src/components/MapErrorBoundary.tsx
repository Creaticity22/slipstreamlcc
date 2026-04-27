import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors thrown by the Leaflet map (tile provider issues,
 * version mismatches, missing globals, etc.) and renders a friendly fallback
 * instead of a blank screen.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[LiveMap] Map render failed, showing fallback:", error);
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
