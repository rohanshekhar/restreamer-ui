import * as Akamai from './Akamai';
import * as Brightcove from './Brightcove';
import * as CDN77 from './CDN77';
import * as Core from './Core';
import * as DaCast from './DaCast';
import * as DASH from './DASH';
import * as Facebook from './Facebook';
import * as Framebuffer from './Framebuffer';
import * as HLS from './HLS';
import * as Icecast from './Icecast';
import * as Image2 from './Image2';
import * as Instagram from './Instagram';
import * as Livespotting from './Livespotting';
import * as MPEGTS from './MPEGTS';
import * as Red5 from './Red5';
import * as Restream from './Restream';
import * as RTMP from './RTMP';
import * as RTSP from './RTSP';
import * as SRT from './SRT';
import * as Twitch from './Twitch';
import * as Twitter from './Twitter';
import * as UDP from './UDP';
import * as Vimeo from './Vimeo';
import * as WOWZA from './WOWZA';
import * as Youtube from './Youtube';

class Registry {
	constructor() {
		this.services = new Map();
	}

	Register(service) {
		this.services.set(service.id, service);
	}

	Get(id) {
		const service = this.services.get(id);
		if (service) {
			return service;
		}

		return null;
	}

	IDs() {
		return Array.from(this.services.keys());
	}

	List() {
		return Array.from(this.services.values());
	}
}

const registry = new Registry();

// The order the services are registered is relevant, i.e. on
// the "add service" screen they appear in this order.
registry.Register(Facebook);
registry.Register(Youtube);
registry.Register(Twitter);
registry.Register(Twitch);
registry.Register(Instagram);
registry.Register(Vimeo);
registry.Register(Restream);
registry.Register(Livespotting);
registry.Register(Brightcove);
registry.Register(Akamai);
registry.Register(DaCast);
registry.Register(CDN77);
registry.Register(Core);
registry.Register(WOWZA);
registry.Register(Red5);
registry.Register(Icecast);
registry.Register(Image2);
registry.Register(RTSP);
registry.Register(RTMP);
registry.Register(HLS);
registry.Register(DASH);
registry.Register(SRT);
registry.Register(UDP);
registry.Register(MPEGTS);
registry.Register(Framebuffer);

export default registry;