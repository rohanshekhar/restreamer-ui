import React from 'react';

import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

import { Trans } from '@lingui/macro';

import Select from '../../../Select';
import Video from '../../settings/Video';

function init(initialState) {
	const state = {
		preset: 'ultrafast',
		bitrate: '4096',
		fps: '25',
		gop: '2',
		profile: 'auto',
		tune: 'zerolatency',
		...initialState,
	};

	return state;
}

function createMapping(settings) {
	const mapping = [
		'-codec:v',
		'libx265',
		'-preset:v',
		`${settings.preset}`,
		'-b:v',
		`${settings.bitrate}k`,
		'-maxrate:v',
		`${settings.bitrate}k`,
		'-bufsize:v',
		`${settings.bitrate}k`,
		'-r',
		`${settings.fps}`,
		'-pix_fmt',
		'yuv420p',
		'-vsync',
		'1',
	];

	if (settings.gop !== 'auto') {
		mapping.push('-g', `${Math.round(parseInt(settings.fps) * parseInt(settings.gop)).toFixed(0)}`);
	}

	if (settings.profile !== 'auto') {
		mapping.push('-profile:v', `${settings.profile}`);
	}

	if (settings.tune !== 'none') {
		mapping.push('-tune:v', `${settings.tune}`);
	}

	return mapping;
}

function Preset(props) {
	return (
		<Select label={<Trans>Preset</Trans>} value={props.value} onChange={props.onChange}>
			<MenuItem value="ultrafast">ultrafast</MenuItem>
			<MenuItem value="superfast">superfast</MenuItem>
			<MenuItem value="veryfast">veryfast</MenuItem>
			<MenuItem value="faster">faster</MenuItem>
			<MenuItem value="fast">fast</MenuItem>
			<MenuItem value="medium">medium</MenuItem>
			<MenuItem value="slow">slow</MenuItem>
			<MenuItem value="slower">slower</MenuItem>
			<MenuItem value="veryslow">veryslow</MenuItem>
		</Select>
	);
}

Preset.defaultProps = {
	value: '',
	onChange: function (event) {},
};

function Tune(props) {
	return (
		<Select label={<Trans>Tune</Trans>} value={props.value} onChange={props.onChange}>
			<MenuItem value="none">none</MenuItem>
			<MenuItem value="animation">animation</MenuItem>
			<MenuItem value="fastdecode">fastdecode</MenuItem>
			<MenuItem value="film">film</MenuItem>
			<MenuItem value="grain">grain</MenuItem>
			<MenuItem value="stillimage">stillimage</MenuItem>
			<MenuItem value="zerolatency">zerolatency</MenuItem>
		</Select>
	);
}

Tune.defaultProps = {
	value: '',
	onChange: function (event) {},
};

function Coder(props) {
	const settings = init(props.settings);

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		props.onChange(newSettings, createMapping(newSettings), automatic);
	};

	const update = (what) => (event) => {
		const newSettings = {
			...settings,
			[what]: event.target.value,
		};

		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Video.Bitrate value={settings.bitrate} onChange={update('bitrate')} allowCustom />
			</Grid>
			<Grid item xs={12}>
				<Video.Framerate value={settings.fps} onChange={update('fps')} allowCustom />
			</Grid>
			<Grid item xs={12}>
				<Video.GOP value={settings.gop} onChange={update('gop')} allowAuto allowCustom />
			</Grid>
			<Grid item xs={6}>
				<Preset value={settings.preset} onChange={update('preset')} />
			</Grid>
			<Grid item xs={6}>
				<Video.Profile value={settings.profile} onChange={update('profile')} />
			</Grid>
			<Grid item xs={6}>
				<Tune value={settings.tune} onChange={update('tune')} />
			</Grid>
		</Grid>
	);
}

Coder.defaultProps = {
	stream: {},
	settings: {},
	onChange: function (settings, mapping) {},
};

const coder = 'libx265';
const name = 'H.265 (libx265)';
const codec = 'h265';
const type = 'video';
const hwaccel = false;

function summarize(settings) {
	return `${name}, ${settings.bitrate} kbit/s, ${settings.fps} FPS, Preset: ${settings.preset}, Profile: ${settings.profile}`;
}

function defaults() {
	const settings = init({});

	return {
		settings: settings,
		mapping: createMapping(settings),
	};
}

export { coder, name, codec, type, hwaccel, summarize, defaults, Coder as component };
