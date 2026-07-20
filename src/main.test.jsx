import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple test component
function TestApp() {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Test App</h1>
            <p>If you see this, React is working!</p>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <TestApp />
    </React.StrictMode>
);
