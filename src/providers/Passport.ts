/**
 * Defines the passport config
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Application } from 'express';
import * as passport from 'passport';

import LocalStrategy from '../services/strategies/Local';



import Log from '../middlewares/Log';

class Passport {
	public mountPackage (_express: Application): Application {
		_express = _express.use(passport.initialize());
		_express = _express.use(passport.session());

		// passport.serializeUser<any, any>((user, done) => {
		// 	done(null, user);
		// });

		// passport.deserializeUser<any, any>((id, done) => {
		// 	User.findById(id, (err, user) => {
		// 		done(err, user);
		// 	});
		// });

		this.mountLocalStrategies();

		return _express;
	}

	public mountLocalStrategies(): void {
		try {
			let j = LocalStrategy.init(passport);
			
			
			// TwitterStrategy.init(passport);
		} catch (_err) {
			console.log(_err)
			Log.error(_err.stack);
		}
	}

	public isAuthenticated (req, res, next): any {
		if (req.isAuthenticated()) {
			return next();
		}

		req.flash('errors', { msg: 'Please Log-In to access any further!'});
		return res.redirect('/login');
	}

	public isAuthorized (req, res, next): any {
		// const provider = req.path.split('/').slice(-1)[0];
		// const token = req.user.tokens.find(token => token.kind === provider);
		// console.log(req.user);
		// if (token) {
			return next();
		// } else {
			// return res.redirect(`/auth/${provider}`);
		// }
	}
}

export default new Passport;
