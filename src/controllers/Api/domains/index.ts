/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";
import * as typeCheckService from "../../../services/validations/typecheck";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";

import axios, { AxiosRequestConfig } from "axios";

import * as XLSX from "xlsx";
import Company from "../../../models/company";
import Product from "../../../models/products";
import { IProducts } from "../../../interfaces/models/products";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { uploadImage } from "../../../services/gcloud/upload";
import Domain from "../../../models/domain";
import { IDomain } from "../../../interfaces/models/domains";

let constants = [
  "subdomain",
  "auth",
  "dashboard",
  "product",
  "instagram",
  "subdomain",
  "website",
  "orders",
  "payments",
  "customers",
  "analytics",
  "profile",
  "messages",
  "delivery",
  "inventory",
];

class Products {
  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      let name = req.query.name as string;

      if (constants.includes(name)) {
        return res.json(
          sendSuccessResponse({
            exists: true,
          })
        );
      }
      let { companyId } = req.user as { companyId: string };

      let company = await Company.findOne({ _id: companyId }).lean();

      if (!company) {
        return res.json(sendErrorResponse("company not found"));
      }
      if (!name) {
        return res.json(sendErrorResponse("name should not be empty"));
      }

      let oldDomain = (await Domain.find({ companyId }).lean())[0];

      if (oldDomain) {
        let meta = company.meta;
        if (!meta) {
          meta = {};
        }
        meta.domainName = oldDomain.name;
        meta.domainId = oldDomain._id;
        let status = await Company.updateOne(
          { _id: company },
          { $set: { meta } },
          { upsert: true }
        );

        if (status.ok) {
          return res.json(
            sendErrorResponse("Domain exists , try again.", null, {
              domain: oldDomain,
            })
          );
        }
      }

      let mongoQuery = { [`meta.domainName`]: name.toLowerCase() } as any;

      let products = await Company.findOne(mongoQuery);

      //  let products1 = await Promise.all(
      //    products.map(async (it) => {
      //      let _id = it?._id;

      //      if (!_id) return { update: false, _id };
      //      delete it?._id;

      //      let update = await Product.updateOne(
      //        { _id: _id },
      //        { status: [1, 2, 3, 4][getRandomIntInclusive(0, 3)] },
      //        {
      //          upsert: true,
      //        }
      //      );

      //      return { update: !!update.ok, _id: _id };
      //    })
      //  );
      return res.json(
        sendSuccessResponse({
          exists: !!products,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getPaths(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = (await Company.find({}).lean()).map((it) => it.meta?.domainName)?.filter(it => !!it);

      if (!domain || !domain?.length) {
        return res.json(sendErrorResponse("No domains found"));
      }

      return res.json(
        sendSuccessResponse({
          domains: domain,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getPathSlugs(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {

		
   

      let products = (await Product.find({}).populate('companyId'))?.filter(it => (it?.companyId as any)?.meta?.domainName && it?.slug)?.map(it => ({domain : (it?.companyId as any)?.meta?.domainName , slug : it.slug})) || []

	   return res.json(
       sendSuccessResponse({
         products,
       })
     );
    } catch (error) {
      next(error);
    }
  }

  public static async post(req: Request, res: Response, next: NextFunction) {
    try {
      let name = req.body.name as string;

      if (constants.includes(req.body.name)) {
        return res.json(sendErrorResponse("restricted keywrod"));
      }
      let { companyId } = req.user as { companyId: string };
      let company = await Company.findOne({ _id: companyId }).lean();

      if (!company) {
        return res.json(sendErrorResponse("company not found"));
      }

      if (!name) {
        return res.json(sendErrorResponse("name should not be empty"));
      }

      let oldDomain = (await Domain.find({ companyId }).lean())[0];

      if (oldDomain) {
        let meta = company.meta;
        if (!meta) {
          meta = {};
        }
        meta.domainName = oldDomain.name;
        meta.domainId = oldDomain._id;
        let status = await Company.updateOne(
          { _id: company },
          { $set: { meta } },
          { upsert: true }
        );

        if (status.ok) {
          return res.json(
            sendErrorResponse("Domain exists , try again.", null, {
              domain: oldDomain,
            })
          );
        }
      }

      let domain = (
        await Domain.insertMany({ name: name.toLowerCase(), companyId })
      )[0];

      if (domain) {
        let meta = company.meta;
        if (!meta) {
          meta = {};
        }
        meta.domainName = name;
        meta.domainId = domain._id;
        let status = await Company.updateOne(
          { _id: company },
          { $set: { meta } },
          { upsert: true }
        );

        if (status.ok) {
          return res.json(
            sendSuccessResponse({
              domainId: domain._id,
              ...meta,
              published: false,
            })
          );
        }
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async patchDomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body as IDomain;
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!domain || !domain.metaData) {
        return res.json(sendErrorResponse("not a domain object"));
      }

      let update = await Domain.updateOne(
        { _id: domainId },
        { $set: { metaData: domain.metaData } },
        { upsert: true }
      );

      if (update.ok) return res.json(sendSuccessResponse({ updated: true }));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async patchDomainMeta(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let meta = req.body as IDomain;
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!meta) {
        return res.json(sendErrorResponse("not a meta object"));
      }

      let domainMeta = (await Domain.findOne({ _id: domainId }).lean())
        ?.metaData;

      if (!domainMeta) {
        domainMeta = {};
      }
      let update = await Domain.updateOne(
        { _id: domainId },
        { $set: { metaData: { ...domainMeta, ...meta } } },
        { upsert: true }
      );

      if (update.ok) return res.json(sendSuccessResponse({ updated: true }));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async togglePublish(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body as IDomain;
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!domain) {
        return res.json(sendErrorResponse("not a domain object"));
      }

      console.log(domain);

      let update = await Domain.updateOne(
        { _id: domainId },
        { $set: { published: !!domain.published } },
        { upsert: true }
      );

      if (update.ok) return res.json(sendSuccessResponse({ updated: true }));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getDomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body.domain;

      if (domain) return res.json(sendSuccessResponse(domain));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getDomainMiddleWare(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!domainId) {
        return res.json(sendErrorResponse("domainId needed"));
      }

      let domain = await Domain.findOne({ _id: domainId, companyId }).lean();

      if (domain?.metaData?.popularProducts?.length) {
        let products = await Product.find({
          companyId,
          _id: { $in: domain?.metaData?.popularProducts },
        }).lean();

        domain.metaData.popularProducts = products;
      }
      if (domain) {
        req.body.domain = domain;
        return next();
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicDomainProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let name = req.params.domain as string;

      if (!name) {
        return res.json(sendErrorResponse("name not found", 1002));
      }
      let domainData = await getDomain(name);

      if (domainData.data) {
        let companyId = domainData?.data?.company?._id;

        req.user = { companyId: companyId };

        return next();
      } else return res.json(domainData);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async getPublicDomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let name = req.params.domain as string;

      if (!name) {
        return res.json(sendErrorResponse("name not found", 1002));
      }

      let data = await getDomain(name);

      return res.json(data);
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicDomainMiddleWare(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let name = req.params.domain as string;

      if (!name) {
        return res.json(sendErrorResponse("name not found", 1002));
      }

      let data = await getDomain(name);

      if (data && data?.data) {
        req.body.domain = data?.data;
        return next();
      }

      return res.json(sendErrorResponse("domain not found", 1002));
    } catch (error) {
      next(error);
    }
  }

  public static async checkSubdomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let name = req.params.domain as string;

      if (!name) {
        return res.json(sendErrorResponse("name not found", 1002));
      }

      if (constants.includes(name)) {
        return res.json(sendErrorResponse("restricted keywrod"));
      }

      let mongoQuery = { [`meta.domainName`]: name } as any;

      let company = await Company.findOne(mongoQuery);

      let domainId = company?.meta?.domainId;

      if (!domainId) {
        return res.json(sendErrorResponse("domainId needed"));
      }

      let domain = await Domain.findOne({ _id: domainId }).lean();

      let payload = {
        exist: false,
        published: false,
      };

      if (domain) {
        payload.exist = true;
        payload.published = domain?.published ? true : false;
      }

      return res.json(sendSuccessResponse(payload));
    } catch (error) {
      next(error);
    }
  }
}

async function getDomain(name: string) {
  let mongoQuery = { [`meta.domainName`]: name } as any;

  let company = await Company.findOne(mongoQuery).select({
    razorpaySecretKey: 0,
  });

  if (!company?.meta?.domainId) {
    return sendErrorResponse("domainId invalid");
  }
  let domainId = company.meta.domainId;

  if (!domainId) {
    return sendErrorResponse("domainId needed");
  }

  let domain = await Domain.findOne({ _id: domainId }).lean();

  if (domain?.metaData?.popularProducts?.length) {
    let products = await Product.find({
      companyId: company._id,
      _id: { $in: domain?.metaData?.popularProducts },
    }).lean();

    domain.metaData.popularProducts = products;
  }

  if (domain) return sendSuccessResponse({ ...domain, company });
  return sendErrorResponse("something went wrong");
}
export default Products;
