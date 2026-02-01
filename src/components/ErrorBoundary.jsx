import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: '#000', color: '#fff', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace',
                    padding: '20px', textAlign: 'center'
                }}>
                    <i className="fa-solid fa-triangle-exclamation fa-4x" style={{ color: '#F44336', marginBottom: 20 }}></i>
                    <h2 style={{ color: '#00E5FF', marginBottom: 10 }}>Something went wrong</h2>
                    <p style={{ color: '#888', marginBottom: 30, maxWidth: 400 }}>
                        The game encountered an unexpected error. Please reload to continue.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: 'linear-gradient(90deg, #00E5FF, #2979FF)',
                            color: 'black', border: 'none', padding: '12px 40px',
                            borderRadius: 25, fontWeight: 'bold', cursor: 'pointer',
                            fontSize: '1rem', boxShadow: '0 5px 15px rgba(0,229,255,0.3)'
                        }}
                    >
                        Reload Game
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
