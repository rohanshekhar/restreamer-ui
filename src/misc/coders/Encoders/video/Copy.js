import React from 'react';

function createMapping(settings) {
	const mapping = ['-codec:v', 'copy', '-vsync', '0', '-copyts', '-start_at_zero'];

	return mapping;
}

function Coder(props) {
	const settings = {};

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		props.onChange(newSettings, createMapping(newSettings), automatic);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return null;
}

Coder.defaultProps = {
	stream: {},
	settings: {},
	onChange: function (settings, mapping) {},
};

function summarize(settings) {
	return `${name}`;
}

function defaults() {
	return {
		settings: {},
		mapping: createMapping({}),
	};
}

const coder = 'copy';
const name = 'Passthrough (copy)';
const codec = 'copy';
const type = 'video';
const hwaccel = false;

export { coder, name, codec, type, hwaccel, summarize, defaults, Coder as component };
