import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useLingui } from '@lingui/react';
import { Trans, t } from '@lingui/macro';
import makeStyles from '@mui/styles/makeStyles';
import urlparser from 'url-parse';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Icon from '@mui/icons-material/AccountTree';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import BoxTextarea from '../../../misc/BoxTextarea';
import Checkbox from '../../../misc/Checkbox';
import FormInlineButton from '../../../misc/FormInlineButton';
import MultiSelect from '../../../misc/MultiSelect';
import MultiSelectOption from '../../../misc/MultiSelectOption';
import Password from '../../../misc/Password';
import Select from '../../../misc/Select';
import Textarea from '../../../misc/Textarea';

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
		mode: 'pull',
		address: '',
		username: '',
		password: '',
		push: {},
		rtsp: {},
		http: {},
		general: {},
		...initialSettings,
	};

	settings.push = {
		type: 'rtmp',
		...settings.push,
	};

	settings.rtsp = {
		udp: false,
		stimeout: 5000000,
		...settings.rtsp,
	};

	settings.http = {
		readNative: true,
		forceFramerate: false,
		framerate: 25,
		userAgent: '',
		...settings.http,
	};

	settings.general = {
		fflags: ['genpts'],
		thread_queue_size: 512,
		...settings.general,
	};

	return settings;
};

const initConfig = (initialConfig) => {
	if (!initialConfig) {
		initialConfig = {};
	}

	const config = {
		rtmp: {},
		hls: {},
		...initialConfig,
	};

	config.rtmp = {
		enabled: false,
		secure: false,
		host: 'localhost',
		local: 'localhost',
		app: '',
		token: '',
		name: 'external',
		...config.rtmp,
	};

	config.hls = {
		secure: false,
		host: 'localhost',
		local: 'localhost',
		credentials: '',
		name: 'external',
		...config.hls,
	};

	return config;
};

const initSkills = (initialSkills) => {
	if (!initialSkills) {
		initialSkills = {};
	}

	const skills = {
		protocols: {},
		...initialSkills,
	};

	skills.protocols = {
		input: [],
		...skills.protocols,
	};

	return skills;
};

const createInputs = (settings, config, skills) => {
	config = initConfig(config);
	skills = initSkills(skills);

	const input = {
		address: '',
		options: [],
	};

	if (settings.general.fflags.length !== 0) {
		input.options.push('-fflags', '+' + settings.general.fflags.join('+'));
	}

	input.options.push('-thread_queue_size', settings.general.thread_queue_size);

	if (settings.mode === 'push') {
		if (settings.push.type === 'hls') {
			input.address = getLocalHLS(config);
		} else {
			input.address = getLocalRTMP(config);
		}
	} else {
		input.address = settings.address;
	}

	const protocol = getProtocolClass(input.address);

	if (settings.mode === 'pull') {
		input.address = addUsernamePassword(input.address, settings.username, settings.password);

		if (protocol === 'rtsp') {
			input.options.push('-timeout', settings.rtsp.stimeout);

			if (settings.rtsp.udp === true) {
				input.options.push('-rtsp_transport', 'udp');
			} else {
				input.options.push('-rtsp_transport', 'tcp');
			}
		} else if (protocol === 'rtmp') {
			input.options.push('-analyzeduration', '3000000');
		} else if (protocol === 'http') {
			input.options.push('-analyzeduration', '20000000');

			if (settings.http.readNative === true) {
				input.options.push('-re');
			}

			if (settings.http.forceFramerate === true) {
				input.options.push('-r', settings.http.framerate);
			}

			if (settings.http.userAgent.length !== 0) {
				input.options.push('-user_agent', settings.http.userAgent);
			}
		}
	}
	/*
	if (skills.protocols.input.includes('playout')) {
		if (protocol === 'http' || protocol === 'rtmp' || protocol === 'rtsp') {
			if (!input.address.startsWith('playout:')) {
				input.address = 'playout:' + input.address;
			}

			input.options.push('-playout_audio', '1');
		}
	}
*/
	return [input];
};

const addUsernamePassword = (address, username, password) => {
	if (username.length === 0 && password.length === 0) {
		return address;
	}

	if (isAuthProtocol(address) === false) {
		return address;
	}

	const url = urlparser(address, {});
	if (username.length !== 0) {
		url.set('username', encodeURIComponent(username));
	}
	if (password.length !== 0) {
		url.set('password', encodeURIComponent(password));
	}

	return url.toString();
};

const getProtocol = (url) => {
	const re = new RegExp('^([a-z][a-z0-9.+-:]*)://', 'i');
	const matches = url.match(re);

	if (matches === null || matches.length === 0) {
		return '';
	}

	return matches[1];
};

const getProtocolClass = (url) => {
	if (typeof url !== 'string') {
		url = '';
	}

	const protocol = getProtocol(url);
	if (protocol.length === 0) {
		return '';
	}

	if (/rtmp(e|s|t)?/.test(protocol) === true) {
		return 'rtmp';
	} else if (/https?/.test(protocol) === true) {
		return 'http';
	} else if (/mms(t|h)/.test(protocol) === true) {
		return 'mms';
	}

	return protocol;
};

const isAuthProtocol = (url) => {
	const protocolClass = getProtocolClass(url);

	// eslint-disable-next-line default-case
	switch (protocolClass) {
		case 'amqp':
		case 'ftp':
		case 'http':
		case 'icecast':
		case 'mms':
		case 'rtmp':
		case 'sftp':
		case 'rtsp':
			return true;
	}

	return false;
};

const getRTMPAddress = (host, app, name, token, secure) => {
	let url = 'rtmp' + (secure ? 's' : '') + '://' + host + app + '/' + name + '.stream';

	if (token.length !== 0) {
		url += '?token=' + encodeURIComponent(token);
	}

	return url;
};

const getRTMP = (config, name) => {
	const url = getRTMPAddress(config.rtmp.host, config.rtmp.app, config.rtmp.name, config.rtmp.token, config.rtmp.secure);

	return [url];
};

const getLocalRTMP = (config, name) => {
	let url = getRTMPAddress(config.rtmp.local, config.rtmp.app, config.rtmp.name, config.rtmp.token, config.rtmp.secure);

	return url;
};

const getHLSAddress = (host, credentials, name, secure) => {
	// Test for IPv6 addresses and put brackets around
	let url = 'http' + (secure ? 's' : '') + '://' + (credentials.length !== 0 ? credentials + '@' : '') + host + '/memfs/ingest/' + name + '.m3u8';

	return url;
};

const getHLS = (config, name) => {
	const url = getHLSAddress(config.hls.host, config.hls.credentials, config.hls.name, config.hls.secure);

	return [url];
};

const getLocalHLS = (config, name) => {
	let url = getHLSAddress(config.hls.local, '', config.hls.name, false);

	return url;
};

const isValidURL = (address) => {
	const protocol = getProtocolClass(address);
	if (protocol.length === 0) {
		return false;
	}

	return true;
};

function Pull(props) {
	const classes = useStyles();
	const settings = props.settings;
	const protocolClass = getProtocolClass(settings.address);
	const authProtocol = isAuthProtocol(settings.address);

	return (
		<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
			<Grid item xs={12}>
				<Typography>
					<Trans>Enter the address of your network source:</Trans>
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<TextField
					variant="outlined"
					fullWidth
					label={<Trans>Address</Trans>}
					placeholder="rtsp://ip:port/path"
					value={settings.address}
					onChange={props.onChange('', 'address')}
				/>
				<Typography variant="caption">
					<Trans>Supports HTTP (HLS, DASH), RTP, RTSP, RTMP, SRT and more.</Trans>
				</Typography>
			</Grid>
			{authProtocol && (
				<React.Fragment>
					<Grid item md={6} xs={12}>
						<TextField
							variant="outlined"
							fullWidth
							label={<Trans>Username</Trans>}
							value={settings.username}
							onChange={props.onChange('', 'username')}
						/>
						<Typography variant="caption">
							<Trans>Username for the device.</Trans>
						</Typography>
					</Grid>
					<Grid item md={6} xs={12}>
						<Password
							variant="outlined"
							fullWidth
							label={<Trans>Password</Trans>}
							value={settings.password}
							onChange={props.onChange('', 'password')}
						/>
						<Typography variant="caption">
							<Trans>Password for the device.</Trans>
						</Typography>
					</Grid>
				</React.Fragment>
			)}
			<Grid item xs={12}>
				<Accordion className="accordion">
					<AccordionSummary elevation={0} expandIcon={<ArrowDropDownIcon />}>
						<Typography>
							<Trans>Advanced settings</Trans>
						</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<Grid container spacing={2}>
							{protocolClass === 'rtsp' && (
								<React.Fragment>
									<Grid item xs={12}>
										<Typography variant="h3">
											<Trans>RTSP</Trans>
										</Typography>
									</Grid>
									<Grid item xs={12}>
										<Checkbox label={<Trans>UDP transport</Trans>} checked={settings.rtsp.udp} onChange={props.onChange('rtsp', 'udp')} />
									</Grid>
									<Grid item xs={12}>
										<TextField
											variant="outlined"
											type="number"
											min="0"
											step="1"
											fullWidth
											label={<Trans>Socket timeout (microseconds)</Trans>}
											value={settings.rtsp.stimeout}
											onChange={props.onChange('rtsp', 'stimeout')}
										/>
									</Grid>
								</React.Fragment>
							)}
							{protocolClass === 'http' && (
								<React.Fragment>
									<Grid item xs={12}>
										<Typography variant="h3">
											<Trans>HTTP and HTTPS</Trans>
										</Typography>
									</Grid>
									<Grid item xs={12}>
										<Checkbox
											label={<Trans>Read input at native speed</Trans>}
											checked={settings.http.readNative}
											onChange={props.onChange('http', 'readNative')}
										/>
										<Checkbox
											label={<Trans>Force input framerate</Trans>}
											checked={settings.http.forceFramerate}
											onChange={props.onChange('http', 'forceFramerate')}
										/>
									</Grid>
									{settings.http.forceFramerate === true && (
										<Grid item xs={12}>
											<TextField
												variant="outlined"
												type="number"
												min="0"
												step="1"
												fullWidth
												label={<Trans>Framerate</Trans>}
												value={settings.http.framerate}
												onChange={props.onChange('http', 'framerate')}
											/>
										</Grid>
									)}
									<Grid item xs={12}>
										<TextField
											variant="outlined"
											fullWidth
											label="User-Agent"
											value={settings.http.userAgent}
											onChange={props.onChange('http', 'userAgent')}
										/>
									</Grid>
								</React.Fragment>
							)}
							<Grid item xs={12}>
								<Typography variant="h3">
									<Trans>General</Trans>
								</Typography>
							</Grid>
							<Grid item xs={12}>
								<TextField
									variant="outlined"
									type="number"
									min="0"
									step="1"
									fullWidth
									label="thread_queue_size"
									value={settings.general.thread_queue_size}
									onChange={props.onChange('general', 'thread_queue_size')}
								/>
							</Grid>
							<Grid item xs={12}>
								<MultiSelect type="select" label="flags" value={settings.general.fflags} onChange={props.onChange('general', 'fflags')}>
									<MultiSelectOption value="discardcorrupt" name="discardcorrupt" />
									<MultiSelectOption value="fastseek" name="fastseek" />
									<MultiSelectOption value="genpts" name="genpts" />
									<MultiSelectOption value="igndts" name="igndts" />
									<MultiSelectOption value="ignidx" name="ignidx" />
									<MultiSelectOption value="nobuffer" name="nobuffer" />
									<MultiSelectOption value="nofillin" name="nofillin" />
									<MultiSelectOption value="noparse" name="noparse" />
									<MultiSelectOption value="sortdts" name="sortdts" />
								</MultiSelect>
							</Grid>
						</Grid>
					</AccordionDetails>
				</Accordion>
			</Grid>
			<Grid item xs={12}>
				<FormInlineButton disabled={!isValidURL(settings.address)} onClick={props.onProbe}>
					<Trans>Probe</Trans>
				</FormInlineButton>
			</Grid>
		</Grid>
	);
}

function Push(props) {
	const classes = useStyles();
	const settings = props.settings;

	return (
		<React.Fragment>
			<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
				<Grid item xs={12}>
					<Select type="select" label={<Trans>Protocol</Trans>} value={settings.push.type} onChange={props.onChange('push', 'type')}>
						<MenuItem value="rtmp">RTMP</MenuItem>
						{/* <MenuItem value="hls">HLS</MenuItem> */}
					</Select>
				</Grid>
			</Grid>
			{settings.push.type === 'rtmp' ? <PushRTMP {...props} /> : settings.push.type === 'hls' ? <PushHLS {...props} /> : null}
		</React.Fragment>
	);
}

function PushHLS(props) {
	const classes = useStyles();
	const settings = props.settings;
	const config = props.config;

	const HLSs = getHLS(config, settings.push.name);

	return (
		<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
			<Grid item xs={12}>
				<Typography>
					<Trans>Send stream to this address:</Trans>
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<BoxTextarea>
					<Textarea rows={HLSs.length} value={HLSs.join('\n')} readOnly allowCopy />
				</BoxTextarea>
			</Grid>
			<Grid item xs={12}>
				<FormInlineButton onClick={props.onProbe}>
					<Trans>Probe</Trans>
				</FormInlineButton>
			</Grid>
		</Grid>
	);
}

function PushRTMP(props) {
	const classes = useStyles();
	const navigate = useNavigate();
	const settings = props.settings;
	const config = props.config;

	let form = null;

	if (config.rtmp.enabled === false) {
		form = (
			<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
				<Grid item xs={12}>
					<Typography>
						<Trans>RTMP server is not enabled</Trans>
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<Button variant="outlined" size="large" fullWidth color="primary" onClick={() => navigate('/settings/rtmp')}>
						<Trans>Enable RTMP server ...</Trans>
					</Button>
				</Grid>
			</Grid>
		);
	} else {
		const RTMPs = getRTMP(config, settings.push.name);

		form = (
			<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
				<Grid item xs={12}>
					<Typography>
						<Trans>Send stream to this address:</Trans>
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<BoxTextarea>
						<Textarea rows={RTMPs.length} value={RTMPs.join('\n')} readOnly allowCopy />
					</BoxTextarea>
				</Grid>
				<Grid item xs={12}>
					<FormInlineButton onClick={props.onProbe}>
						<Trans>Probe</Trans>
					</FormInlineButton>
				</Grid>
			</Grid>
		);
	}

	return form;
}

function Source(props) {
	const classes = useStyles();
	const { i18n } = useLingui();
	const settings = initSettings(props.settings);
	const config = initConfig(props.config);
	const skills = initSkills(props.skills);

	const handleChange = (section, what) => (event) => {
		const value = event.target.value;

		if (section === 'http') {
			if (['readNative', 'forceFramerate'].includes(what)) {
				settings.http[what] = !settings.http[what];
			} else {
				settings.http[what] = value;
			}
		} else if (section === 'rtsp') {
			if (['udp'].includes(what)) {
				settings.rtsp[what] = !settings.rtsp[what];
			} else {
				settings.rtsp[what] = value;
			}
		} else if (section === 'general') {
			if ([].includes(what)) {
				settings.general[what] = !settings.general[what];
			} else {
				settings.general[what] = value;
			}
		} else if (section === 'push') {
			settings.push[what] = value;
		} else {
			settings[what] = value;
		}

		props.onChange({
			...settings,
		});
	};

	const handleProbe = () => {
		props.onProbe(settings, createInputs(settings, config, skills));
	};

	return (
		<React.Fragment>
			<Grid container alignItems="flex-start" spacing={2} className={classes.gridContainer}>
				<Grid item xs={12}>
					<Select type="select" label={<Trans>Pull or recieve the data:</Trans>} value={settings.mode} onChange={handleChange('', 'mode')}>
						<MenuItem value="pull">{i18n._(t`Pull Mode`)}</MenuItem>
						<MenuItem value="push">{i18n._(t`Receive Mode`)}</MenuItem>
					</Select>
				</Grid>
			</Grid>
			{settings.mode === 'pull' ? (
				<Pull settings={settings} config={config} onChange={handleChange} onProbe={handleProbe} />
			) : (
				<Push settings={settings} config={config} onChange={handleChange} onProbe={handleProbe} />
			)}
		</React.Fragment>
	);
}

Source.defaultProps = {
	settings: {},
	config: {},
	skills: null,
	onChange: function (settings) {},
	onProbe: function (settings, inputs) {},
};

function SourceIcon(props) {
	return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'network';
const name = <Trans>Network source</Trans>;
const capabilities = ['audio', 'video'];

const func = {
	initSettings,
	initConfig,
	initSkills,
	createInputs,
	getProtocolClass,
	getRTMP,
	getHLS,
	isValidURL,
	isAuthProtocol,
};

export { id, name, capabilities, SourceIcon as icon, Source as component, func };
