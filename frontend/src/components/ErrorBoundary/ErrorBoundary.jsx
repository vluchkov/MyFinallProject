import React from 'react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

const ErrorDisplay = ({ error, errorInfo }) => {
  return (
    <div className={styles.errorContainer}>
      <h2>Что-то пошло не так</h2>
      <p>Произошла ошибка. Пожалуйста, попробуйте перезагрузить страницу.</p>
      <details className={styles.errorDetails}>
        <summary>Показать детали ошибки</summary>
        <pre>{error && error.toString()}</pre>
        <pre>{errorInfo && errorInfo.componentStack}</pre>
      </details>
      <button
        onClick={() => window.location.reload()}
        className={styles.reloadButton}
      >
        Перезагрузить страницу
      </button>
    </div>
  );
};

export default ErrorBoundary; 