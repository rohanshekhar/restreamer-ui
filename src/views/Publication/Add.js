import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import { useLingui } from '@lingui/react';
import { useTheme } from '@mui/material/styles';
import { Trans, t } from '@lingui/macro';
import makeStyles from '@mui/styles/makeStyles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import * as helper from './helper';
import * as M from '../../utils/metadata';
import EncodingSelect from '../../misc/EncodingSelect';
import H from '../../utils/help';
import NotifyContext from '../../contexts/Notify';
import Paper from '../../misc/Paper';
import PaperHeader from '../../misc/PaperHeader';
import PaperFooter from '../../misc/PaperFooter';
import ProcessControl from '../../misc/controls/Process';
import Services from './Services';
import TabPanel from '../../misc/TabPanel';
import TabsVerticalGrid from '../../misc/TabsVerticalGrid';

const useStyles = makeStyles((theme) => ({
	buttonAbort: {
		marginBottom: '0.3em',
	},
	gridContainer: {
		marginTop: '0.5em',
	},
	serviceDescription: {
		margin: '1em 0em 1em 0em',
	},
	serviceIcon: {
		fontSize: '4rem!important',
		maxHeight: 64,
		marginTop: '-0.065em',
	},
	buttonGroup: {
		marginTop: '0.5em',
		marginBottom: '-0.5em',
	},
}));

export default function Add(props) {
	const theme = useTheme();
	const breakpointUpSm = useMediaQuery(theme.breakpoints.up('sm'));
	const classes = useStyles();
	const { i18n } = useLingui();
	const navigate = useNavigate();
	const { channelid: _channelid } = useParams();
	const notify = React.useContext(NotifyContext);
	const [$service, setService] = React.useState('');
	const [$settings, setSettings] = React.useState(M.initEgressMetadata({}));
	const [$sources, setSources] = React.useState([]);
	const [$filter, setFilter] = React.useState('all');
	const [$tab, setTab] = React.useState('general');
	const [$skills, setSkills] = React.useState(null);
	const [$metadata, setMetadata] = React.useState({
		name: '',
		description: '',
		license: '',
	});
	const [$saving, setSaving] = React.useState(false);

	React.useEffect(() => {
		(async () => {
			await load();
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const load = async () => {
		const channelid = props.restreamer.SelectChannel(_channelid);
		if (channelid === '' || channelid !== _channelid) {
			navigate('/', { replace: true });
			return;
		}

		const skills = await props.restreamer.Skills();
		setSkills(skills);

		let ingest = await props.restreamer.GetIngestMetadata(_channelid);
		setMetadata({
			...$metadata,
			name: ingest.meta.name,
			description: ingest.meta.description,
			license: ingest.license,
		});

		setSources(helper.createSourcesFromStreams(ingest.streams));
	};

	const handleFilterChange = (event, value) => {
		if (!value) {
			return;
		}

		setFilter(value);
	};

	const handleServiceSelect = (service) => () => {
		if (service.length !== 0) {
			const s = Services.Get(service);
			if (s === null) {
				return;
			}

			const serviceSkills = helper.conflateServiceSkills(s.requires, $skills);

			const profiles = $settings.profiles;
			profiles[0].video = helper.preselectProfile(profiles[0].video, 'video', $sources[0].streams, serviceSkills.codecs.video, $skills.encoders.video);
			profiles[0].audio = helper.preselectProfile(profiles[0].audio, 'audio', $sources[0].streams, serviceSkills.codecs.audio, $skills.encoders.audio);

			setSettings({
				...$settings,
				name: s.name,
				profiles: profiles,
				streams: M.createOutputStreams($sources, profiles),
			});

			setTab('general');
		} else {
			// Reset the service outputs and settings
			setSettings({
				...$settings,
				...M.initEgressMetadata({}),
			});
		}

		setService(service);
	};

	const handleServiceChange = (outputs, settings) => {
		if (!Array.isArray(outputs)) {
			outputs = [outputs];
		}

		setSettings({
			...$settings,
			outputs: outputs,
			settings: settings,
		});
	};

	const handleProcessing = (type) => (encoder, decoder) => {
		const profiles = $settings.profiles;

		profiles[0][type].encoder = encoder;
		profiles[0][type].decoder = decoder;

		setSettings({
			...$settings,
			profiles: profiles,
			streams: M.createOutputStreams($sources, profiles),
		});
	};

	const handleServiceDone = async () => {
		setSaving(true);

		const [inputs, outputs] = helper.createInputsOutputs($sources, $settings.profiles, $settings.outputs);

		const [id, err] = await props.restreamer.CreateEgress(_channelid, $service, inputs, outputs, $settings.control);
		if (err !== null) {
			setSaving(false);
			notify.Dispatch('error', 'save:egress:' + $service, i18n._(t`Failed to create publication service (${err.message})`));
			return;
		}

		await props.restreamer.SetEgressMetadata(_channelid, id, $settings);

		let message = i18n._(t`The publication service has been created`);
		if ($settings.name.length !== 0) {
			message = i18n._(t`The publication service "${$settings.name}" has been created`);
		}

		setSaving(false);

		notify.Dispatch('success', 'save:egress:' + $service, message);

		navigate(`/${_channelid}/`);
	};

	const handleServiceName = (event) => {
		const name = event.target.value;

		setSettings({
			...$settings,
			name: name,
		});
	};

	const handleProcessControlChange = (control) => {
		setSettings({
			...$settings,
			control: {
				...$settings.control,
				process: control,
			},
		});
	};

	const handleAbort = () => {
		navigate(`/${_channelid}`);
	};

	const handleChangeTab = (event, value) => {
		setTab(value);
	};

	const handleHelp = () => {
		let topic = 'publication-add';

		if ($service !== '') {
			topic = 'publication-' + $tab;
		}

		H(topic);
	};

	const channelid = props.restreamer.SelectChannel(_channelid);
	if (channelid === '' || channelid !== _channelid) {
		navigate('/', { replace: true });
		return null;
	}

	let serviceList = [];

	let ServiceControl = null;
	let ServiceIcon = null;
	let serviceSkills = null;

	let service = {};

	const enableProcessing = true;

	if ($service === '') {
		for (let s of Services.List()) {
			if ($filter !== 'all') {
				if (s.category !== $filter) {
					continue;
				}
			}

			const Icon = s.icon;

			// TODO: Style Tooltip + Fix Tooltip + Disabled
			if (helper.checkServiceRequirements(s.requires, $skills) === false) {
				serviceList.push(
					<Grid item xs={12} sm={6} md={3} align="center" key={s.id}>
						<Tooltip
							title={
								<React.Fragment>
									<Typography variant="subtitle2">
										<Trans>Incompatible</Trans>
									</Typography>
									<Typography>
										<Trans>Check the requirements</Trans>
									</Typography>
								</React.Fragment>
							}
							placement="left"
							arrow
						>
							<div>
								<Button variant="big" disabled>
									<div>
										<Icon />
										<Typography>{s.name}</Typography>
									</div>
								</Button>
							</div>
						</Tooltip>
					</Grid>
				);
			} else {
				serviceList.push(
					<Grid item xs={12} sm={6} md={3} align="center" key={s.id}>
						<Button variant="big" onClick={handleServiceSelect(s.id)}>
							<div>
								<Icon />
								<Typography>{s.name}</Typography>
							</div>
						</Button>
					</Grid>
				);
			}
		}
	} else {
		service = Services.Get($service);
		if (service === null) {
			return null;
		}

		ServiceControl = service.component;
		ServiceIcon = service.icon;

		serviceSkills = helper.conflateServiceSkills(service.requires, $skills);
	}

	return (
		<React.Fragment>
			<Paper xs={12} md={10}>
				<PaperHeader
					title={
						<React.Fragment>
							{$service === '' && <Trans>Add Publication</Trans>}
							{$service !== '' && (
								<React.Fragment>
									<Trans>Add: {service.name}</Trans>
								</React.Fragment>
							)}
						</React.Fragment>
					}
					onAbort={handleAbort}
					onHelp={handleHelp}
				/>
				{$service === '' ? (
					<React.Fragment>
						<Grid container spacing={2}>
							<Grid item xs={12} align="center">
								<ToggleButtonGroup
									className={classes.buttonGroup}
									size={breakpointUpSm ? 'medium' : 'small'}
									value={$filter}
									exclusive
									onChange={handleFilterChange}
								>
									<ToggleButton value="all">
										<Trans>All</Trans>
									</ToggleButton>
									<ToggleButton value="platform">
										<Trans>Platforms</Trans>
									</ToggleButton>
									<ToggleButton value="software">
										<Trans>Software</Trans>
									</ToggleButton>
									<ToggleButton value="universal">
										<Trans>Protocols</Trans>
									</ToggleButton>
								</ToggleButtonGroup>
							</Grid>
						</Grid>
						<Grid container spacing={2} className={classes.gridContainer}>
							{serviceList}
							<Grid item xs={12} className={classes.buttonAbort}>
								<Button variant="outlined" color="default" onClick={handleAbort}>
									<Trans>Abort</Trans>
								</Button>
							</Grid>
						</Grid>
					</React.Fragment>
				) : (
					<React.Fragment>
						<Grid container spacing={1}>
							<TabsVerticalGrid>
								<Tabs orientation="vertical" variant="scrollable" value={$tab} onChange={handleChangeTab} className="tabs">
									<Tab className="tab" label={<Trans>General</Trans>} value="general" />
									<Tab className="tab" label={<Trans>Process control</Trans>} value="process" />
									{enableProcessing && <Tab className="tab" label={<Trans>Encoding</Trans>} value="encoding" />}
								</Tabs>
								<TabPanel value={$tab} index="general" className="panel">
									<Grid container spacing={2}>
										<Grid item xs={12} md={2}>
											<ServiceIcon className={classes.serviceIcon} />
										</Grid>
										<Grid item xs={12} md={10}>
											<Typography variant="h1">{service.name}</Typography>
											<Typography>v{service.version}</Typography>
										</Grid>
										<Grid item xs={12} className={classes.serviceDescription}>
											<Typography>{service.description}</Typography>
										</Grid>
										<Grid item xs={12}>
											<TextField
												variant="outlined"
												fullWidth
												label={<Trans>Service name</Trans>}
												value={$settings.name}
												onChange={handleServiceName}
											/>
										</Grid>
										<Grid item xs={12}>
											<ServiceControl
												settings={$settings.settings}
												skills={serviceSkills}
												metadata={$metadata}
												streams={$settings.streams}
												onChange={handleServiceChange}
											/>
										</Grid>
										<Grid item xs={12}>
											<Divider />
										</Grid>
										<Grid item xs={12}>
											<Typography>
												<Trans>Maintainer:</Trans>{' '}
												<Link color="secondary" target="_blank" href={service.author.creator.link}>
													{service.author.maintainer.name}
												</Link>
											</Typography>
										</Grid>
									</Grid>
								</TabPanel>
								<TabPanel value={$tab} index="process" className="panel">
									<Grid container spacing={2}>
										<Grid item xs={12} md={2}>
											<ServiceIcon className={classes.serviceIcon} />
										</Grid>
										<Grid item xs={12} md={10}>
											<Typography variant="h1">{service.name}</Typography>
											<Typography>v{service.version}</Typography>
										</Grid>
										<Grid item xs={12}>
											<Divider />
										</Grid>
										<Grid item xs={12}>
											<Typography variant="h2">
												<Trans>Process</Trans>
											</Typography>
										</Grid>
										<Grid item xs={12}>
											<ProcessControl settings={$settings.control.process} onChange={handleProcessControlChange} />
										</Grid>
										<Grid item xs={12}>
											<Divider />
										</Grid>
										<Grid item xs={12}>
											<Typography>
												<Trans>Maintainer:</Trans>{' '}
												<Link color="secondary" target="_blank" href={service.author.creator.link}>
													{service.author.maintainer.name}
												</Link>
											</Typography>
										</Grid>
									</Grid>
								</TabPanel>
								<TabPanel value={$tab} index="encoding" className="panel">
									<Grid container spacing={2}>
										<Grid item xs={12} md={2}>
											<ServiceIcon className={classes.serviceIcon} />
										</Grid>
										<Grid item xs={12} md={10}>
											<Typography variant="h1">{service.name}</Typography>
											<Typography>v{service.version}</Typography>
										</Grid>
										<Grid item xs={12}>
											<Divider />
										</Grid>
										<Grid item xs={12}>
											<Typography variant="h2">
												<Trans>Encoding</Trans>
											</Typography>
										</Grid>
										<Grid item xs={12}>
											<Typography variant="subheading">
												<Trans>Please use "Passthrough (copy)" if possible. Encoding requires additional CPU/GPU resources.</Trans>
											</Typography>
										</Grid>
										<Grid item xs={12}>
											<Typography variant="h4">
												<Trans>Video</Trans>
											</Typography>
										</Grid>
										<Grid item xs={12}>
											<EncodingSelect
												type="video"
												streams={$sources[0].streams}
												profile={$settings.profiles[0].video}
												codecs={serviceSkills.codecs.video}
												availableEncoders={$skills.encoders.video}
												availableDecoders={$skills.decoders.video}
												onChange={handleProcessing('video')}
											/>
										</Grid>
										<Grid item xs={12}>
											<Typography variant="h4">
												<Trans>Audio</Trans>
											</Typography>
										</Grid>
										<Grid item xs={12}>
											<EncodingSelect
												type="audio"
												streams={$sources[0].streams}
												profile={$settings.profiles[0].audio}
												codecs={serviceSkills.codecs.audio}
												availableEncoders={$skills.encoders.audio}
												availableDecoders={$skills.decoders.audio}
												onChange={handleProcessing('audio')}
											/>
										</Grid>
										<Grid item xs={12}>
											<Divider />
										</Grid>
										<Grid item xs={12}>
											<Typography>
												<Trans>Maintainer:</Trans>{' '}
												<Link color="secondary" target="_blank" href={service.author.creator.link}>
													{service.author.maintainer.name}
												</Link>
											</Typography>
										</Grid>
									</Grid>
								</TabPanel>
							</TabsVerticalGrid>
						</Grid>
						<PaperFooter
							buttonsLeft={
								<React.Fragment>
									<Button variant="outlined" color="default" onClick={handleAbort}>
										<Trans>Close</Trans>
									</Button>
									<Button variant="outlined" color="default" onClick={handleServiceSelect('')}>
										<Trans>Back</Trans>
									</Button>
								</React.Fragment>
							}
							buttonsRight={
								<Button variant="outlined" color="primary" onClick={handleServiceDone} disabled={$settings.output === null || $saving === true}>
									<Trans>Save</Trans>
								</Button>
							}
						/>
					</React.Fragment>
				)}
			</Paper>
			<Backdrop open={$saving}>
				<CircularProgress color="inherit" />
			</Backdrop>
		</React.Fragment>
	);
}

Add.defaultProps = {
	restreamer: null,
};

Add.propTypes = {
	restreamer: PropTypes.object.isRequired,
};
