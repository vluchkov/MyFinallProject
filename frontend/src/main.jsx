import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import store from './Redux/store';
import { BrowserRouter } from 'react-router-dom'; // Импортируем BrowserRouter
import { setAuthFromToken } from './Redux/authSlice'; // Импортируем функцию для установки аутентификации из токена

// store.dispatch(setAuthFromToken()); // Вызываем при инициализации

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);