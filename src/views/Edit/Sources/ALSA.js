import React from 'react';

import { useLingui } from '@lingui/react';
import { Trans, t } from '@lingui/macro';
import makeStyles from '@mui/styles/makeStyles';
import Grid from '@mui/material/Grid';
import Icon from '@mui/icons-material/Usb';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Audio from '../../../misc/coders/settings/Audio';
import FormInlineButton from '../../../misc/FormInlineButton';
import SelectCustom from '../../../misc/SelectCustom';

const useStyles = makeStyles((theme) => ({
	gridContainer: {
		marginTop: '0.5em',
	},
}));

const initSettings = (initialSettings) => {
	if (!initialSettings) {
		initialSettings = {};
	}

	const settings = {
		address: 'hw:1,0',
		device: '1,0',
		sampling: '44100',
		channels: '1',
		delay: 0,
		...initialSettings,
	};

	return settings;
};

const createInputs = (settings) => {
	let address = `hw:${settings.device}`;

	const input = {
		address: address,
		options: [],
	};

	input.options.push('-f', 'alsa');
	input.options.push('-thread_queue_size', '512');
	input.options.push('-ac', '' + settings.channels);
	input.options.push('-ar', '' + settings.sampling);

	if (settings.delay !== 0) {
		input.options.push('-itsoffset', settings.delay + 'ms');
	}

	return [input];
};

function Source(props) {
	const classes = useStyles();
	const { i18n } = useLingui();
	const settings = initSettings(props.settings);

	const handleChange = (what) => (event) => {
		let data = {};

		if (['address', 'device', 'sampling', 'channels', 'delay'].includes(what)) {
			data[what] = event.target.value;
		}

		props.onChange({
			...settings,
			...data,
		});
	};

	const handleProbe = () => {
		props.onProbe(settings, createInputs(settings));
	};

	const filteredDevices = props.knownDevices.filter((device) => device.media === 'audio');
	const options = filteredDevices.map((device) => {
		return {
			value: device.id.replace(/^hw:/, ''),
			label: device.name,
		};
	});

	options.unshift({
		value: 'none',
		label: i18n._(t`Choose an input device ...`),
		disabled: true,
	});
	options.push({
		value: 'custom',
		label: i18n._(t`Custom ...`),
	});

	const audioDevices = (
		<SelectCustom
			options={options}
			label={<Trans>Audio device</Trans>}
			customLabel={<Trans>Custom audio device</Trans>}
			value={settings.device}
			onChange={handleChange('device')}
			variant="outlined"
			allowCustom
		/>
	);

	return (
		<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
			<Grid item xs={12}>
				<Typography>
					<Trans>Select a device:</Trans>
				</Typography>
			</Grid>
			<Grid item xs={12}>
				{audioDevices}
			</Grid>
			<Grid item xs={12}>
				<Audio.Sampling value={settings.sampling} onChange={handleChange('sampling')} allowCustom />
			</Grid>
			<Grid item xs={6}>
				<TextField variant="outlined" fullWidth label={<Trans>Channels</Trans>} value={settings.channels} onChange={handleChange('channels')} />
			</Grid>
			<Grid item xs={6}>
				<TextField variant="outlined" fullWidth label={<Trans>Delay (ms)</Trans>} value={settings.delay} onChange={handleChange('delay')} />
			</Grid>
			<Grid item xs={12}>
				<FormInlineButton onClick={handleProbe}>
					<Trans>Probe</Trans>
				</FormInlineButton>
			</Grid>
		</Grid>
	);
}

Source.defaultProps = {
	knownDevices: [],
	settings: {},
	onChange: function (settings) {},
	onProbe: function (settings, inputs) {},
};

function SourceIcon(props) {
	return <Icon {...props} />;
}

const id = 'alsa';
const name = <Trans>ALSA</Trans>;
const capabilities = ['audio'];

const func = {
	initSettings,
	createInputs,
};

export { id, name, capabilities, SourceIcon as icon, Source as component, func };
