import React from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { useLingui } from '@lingui/react';
import { Trans, t } from '@lingui/macro';

import Audio from '../../settings/Audio';
import SelectCustom from '../../../../misc/SelectCustom';

function init(initialState) {
	const state = {
		bitrate: '64',
		delay: 'auto',
		channels: '2',
		layout: 'stereo',
		sampling: '44100',
		...initialState,
	};

	return state;
}

function createMapping(settings, stream) {
	let sampling = settings.sampling;
	let layout = settings.layout;

	if (sampling === 'inherit') {
		sampling = stream.sampling_hz;
	}

	if (layout === 'inherit') {
		layout = stream.layout;
	}

	const mapping = ['-codec:a', 'opus', '-b:a', `${settings.bitrate}k`, '-vbr', 'on', '-shortest', '-af', `aresample=osr=${sampling}:ocl=${layout}`];

	if (settings.delay !== 'auto') {
		mapping.push('opus_delay', settings.delay);
	}

	return mapping;
}

function Delay(props) {
	const { i18n } = useLingui();
	const options = [
		{ value: '20', label: '20ms' },
		{ value: '30', label: '30ms' },
		{ value: '50', label: '50ms' },
	];

	if (props.allowAuto === true) {
		options.unshift({ value: 'auto', label: 'auto' });
	}

	if (props.allowCustom === true) {
		options.push({ value: 'custom', label: i18n._(t`Custom ...`) });
	}

	return (
		<React.Fragment>
			<SelectCustom
				options={options}
				label={props.label}
				customLabel={props.customLabel}
				value={props.value}
				onChange={props.onChange}
				variant={props.variant}
				allowCustom={props.allowCustom}
			/>
			<Typography variant="caption">
				<Trans>Maximum delay in milliseconds.</Trans>
			</Typography>
		</React.Fragment>
	);
}

Delay.defaultProps = {
	variant: 'outlined',
	allowAuto: false,
	allowCustom: false,
	label: <Trans>Delay</Trans>,
	customLabel: <Trans>Custom delay</Trans>,
	onChange: function () {},
};

function Coder(props) {
	const settings = init(props.settings);
	const stream = props.stream;

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		props.onChange(newSettings, createMapping(newSettings, stream), automatic);
	};

	const update = (what) => (event) => {
		const value = event.target.value;

		const newSettings = {
			...settings,
			[what]: value,
		};

		if (what === 'layout') {
			let channels = stream.channels;

			switch (value) {
				case 'mono':
					channels = 1;
					break;
				case 'stereo':
					channels = 2;
					break;
				default:
					break;
			}

			newSettings.channels = channels;
		}

		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Audio.Bitrate value={settings.bitrate} onChange={update('bitrate')} allowCustom />
			</Grid>
			<Grid item xs={12}>
				<Delay value={settings.delay} onChange={update('delay')} allowAuto allowCustom />
			</Grid>
			<Grid item xs={12}>
				<Audio.Sampling value={settings.sampling} onChange={update('sampling')} allowInherit allowCustom />
			</Grid>
			<Grid item xs={12}>
				<Audio.Layout value={settings.layout} onChange={update('layout')} allowInherit />
			</Grid>
		</Grid>
	);
}

Coder.defaultProps = {
	stream: {},
	settings: {},
	onChange: function (settings, mapping) {},
};

const coder = 'opus';
const name = 'Opus';
const codec = 'opus';
const type = 'audio';
const hwaccel = false;

function summarize(settings) {
	return `${name}, ${settings.bitrate} kbit/s, ${settings.layout}, ${settings.sampling}Hz`;
}

function defaults(stream) {
	const settings = init({});

	return {
		settings: settings,
		mapping: createMapping(settings, stream),
	};
}

export { coder, name, codec, type, hwaccel, summarize, defaults, Coder as component };
