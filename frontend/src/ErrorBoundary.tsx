import React from "react";
export class ErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) {
      return <div style={{color:'red', padding:20, background:'black', zIndex:9999, position:'relative'}}>
        <h1>Fatal Error</h1>
        <pre>{this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}
