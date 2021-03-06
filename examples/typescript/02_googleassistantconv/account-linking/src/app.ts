import { App } from 'jovo-framework';

import { GoogleAssistant } from 'jovo-platform-googleassistantconv';
import { JovoDebugger } from 'jovo-plugin-debugger';
import { FileDb } from 'jovo-db-filedb';

const app = new App();

app.use(new GoogleAssistant(), new JovoDebugger(), new FileDb());

app.setHandler({
	LAUNCH() {
		return this.ask('Do you want to link your account?');
	},

	YesIntent() {
		this.$googleAction!.setNextScene('AccountLinkingScene');
		this.ask('Great!');
	},

	async ON_SIGN_IN() {
		if (this.$googleAction!.isAccountLinkingLinked()) {
			const profile = await this.$googleAction!.$user.getGoogleProfile();
			this.tell(`Hi ${profile.given_name}`);
		} else if (this.$googleAction!.isAccountLinkingRejected()) {
			this.tell('Too bad. Good bye');
		} else {
			this.tell('Something went wrong');
		}
	},
});

export { app };
