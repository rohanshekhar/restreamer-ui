import React from 'react';
import ReactDOM from 'react-dom';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import '@fontsource/dosis';
import '@fontsource/roboto';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './theme';
import RestreamerUI from './RestreamerUI';

let address = window.location.protocol + '//' + window.location.host + '/' + window.location.pathname.split('/')[1];

const urlParams = new URLSearchParams(window.location.search.substring(1));
if (urlParams.has('address') === true) {
	address = urlParams.get('address');
}

ReactDOM.render(
	<StyledEngineProvider injectFirst>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<RestreamerUI address={address} />
		</ThemeProvider>
	</StyledEngineProvider>,
	document.getElementById('root')
);
