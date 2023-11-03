import '../styles/globals.css';
import '@fontsource/roboto';
import 'react-multi-carousel/lib/styles.css';

import type { AppProps } from 'next/app';
import { ChakraBaseProvider } from '@chakra-ui/react';
import { theme } from 'src/config/theme';

function MyApp({ Component, pageProps }: AppProps) {
	return (
	       <ChakraBaseProvider theme={theme}>
            <Component {...pageProps} />
		   </ChakraBaseProvider>
	);
}

export default MyApp;
