/**
 * Refresh JWToken
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from 'jsonwebtoken';


import AccountUser from "../../../models/accountuser";
import Company from '../../../models/company';
import Locals from '../../../providers/Locals';
import { sendSuccessResponse } from '../../../services/response/sendresponse';

class RefreshToken {
	public static getToken (req): string {
		if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
			return req.headers.authorization.split(' ')[1];
		} else if (req.query && req.query.token) {
			return req.query.token;
		}

		return '';
	}

	public static async perform (req, res): Promise<any> {
		const _token = RefreshToken.getToken(req);
	
		if (_token === '') {
			return res.json({
				error: ['Invalid Token!']
			});
		}

		const decode = jwt.decode(_token, Locals.config().appSecret, {
      expiresIn: (60 * 60) * 30,
    });

		  const token = jwt.sign(
        {
          email: decode?.email,
          name: decode?.name,
          companyId: decode?.companyId,
          accountId: decode?.accountId,
        },
        Locals.config().appSecret,
        {
          expiresIn: 60 * 60 * 30,
        }
      );

	    

	  const accountDetails = await AccountUser.findOne({
      email: decode.email,
    }).lean();

	let companyDetails = await Company.findOne({
    _id: accountDetails?.companyId,
  }).populate("meta.domainId");

			return res.json(
        sendSuccessResponse({
          token,
          token_expires_in: 10 * 600,
          account: accountDetails,
          company: companyDetails,
        })
      );
	}
}

export default RefreshToken;
