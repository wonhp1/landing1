import '../styles/globals.css';
import { NotionCacheProvider } from '../contexts/NotionCacheContext';


function MyApp({ Component, pageProps }) {
    return (
        <NotionCacheProvider>
            <Component {...pageProps} />
        </NotionCacheProvider>
    );
}

export default MyApp;
