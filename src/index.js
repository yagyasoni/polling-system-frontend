import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assuming you have some global CSS
import App from './App'; // This is your main App component

// If you had any Redux-related imports here, they are now removed.
// For example, lines like:
// import { createStore } from 'redux';
// import { Provider } from 'react-redux';
// import rootReducer from './redux/reducer'; // This specific line was causing the error

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* If you had a <Provider store={store}> wrapper here, it is now removed */}
    <App />
  </React.StrictMode>
);

// If you have reportWebVitals or other non-Redux code here, it would remain.
// For example:
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();