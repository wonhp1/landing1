import '../styles/index.module.css'; // CSS 모듈 임포트

function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />;
}

export default MyApp;