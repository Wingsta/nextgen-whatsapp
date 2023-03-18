/**
 * Define passport's local strategy
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */


import AccountUser from "../../models/accountuser";
import Log from "../../middlewares/Log";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import Locals from "../../providers/Locals";
import Profile from "../../models/profile";


var opts = {} as Record<string, any>;
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = Locals.config().profileSecret;

class Local {
  public static init(_passport: any): any {
    _passport.use('profile',
      new JwtStrategy(opts, function (jwt_payload, done) {
        
        Profile.findOne({ _id: jwt_payload.id }, function (err, user) {
          if (err) {
            console.log(err)
            return done(err, false);
          }
          
          if (user) {
            
            return done(null, jwt_payload);
          } else {
            return done(null, false);
            // or you could create a new account
          }
        });
      })
    );
  }
}

export default Local;
