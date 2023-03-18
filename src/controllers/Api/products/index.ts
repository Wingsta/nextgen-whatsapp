/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
import { v1 as uuidv1 } from "uuid";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";
import * as typeCheckService from "../../../services/validations/typecheck";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";
import * as slug from "slug";
import axios, { Axios, AxiosRequestConfig } from "axios";

import * as XLSX from "xlsx";
import Company from "../../../models/company";
import Product from "../../../models/products";
import Category from "../../../models/category";
import { IProducts } from "../../../interfaces/models/products";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { uploadImage } from "../../../services/gcloud/upload";
import { updateCategoryProduct } from "../common/common";
import { replaceSpecialChars } from "../../../utils/constants";

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

export const statusMap = {
  "in stock": 1,
  "low stock": 2,
  "out of stock": 3,
  closed: 4,
};

class Products {
  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      let searchTerm = req.query.searchTerm as string;
      let { companyId } = req.user as { companyId: string };
      let {
        limit = 10,
        offset = 0,
        sortBy = "addedDate",
        sortType = "asc",
        status,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }

      const { categoryId } = req.body as any;
      
      let mongoQuery = { companyId } as any;

      if (categoryId && categoryId.length > 0) {
        mongoQuery.categoryId = { $in: categoryId }
      }

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }
      if (searchTerm) {
        searchTerm = replaceSpecialChars(searchTerm);
        mongoQuery["$or"] = [
          { sku: new RegExp(searchTerm, "i") },
          { name: new RegExp(searchTerm, "i") },
        ];
      }

      let products = await Product.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .lean();
      let totalCount = await Product.find(mongoQuery).count();

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
          totalCount,
          currentPage: offset / limit + 1,
          products,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getAllProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let searchTerm = req.query.searchTerm as string;
      let { companyId } = req.user as { companyId: string };
      let {
        limit = 10,
        offset = 0,
        sortBy = "addedDate",
        sortType = "asc",
        status,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = { companyId } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }
      if (searchTerm) {
        searchTerm = replaceSpecialChars(searchTerm);
        mongoQuery["$or"] = [
          { sku: new RegExp(searchTerm, "i") },
          { name: new RegExp(searchTerm, "i") },
        ];
      }

      let products = await Product.find({
        ...mongoQuery,
        categoryId: { $in: null },
      })
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .lean();

      let productsGrossing = await Product.find(mongoQuery)
        .sort([["price", -1]])
        .skip(0)
        .limit(10)
        .lean();

      let productsRecent = await Product.find(mongoQuery)
        .sort([["updatedAt", -1]])
        .skip(0)
        .limit(5)
        .lean();

      let totalCount = await Product.find(mongoQuery).count();

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
          totalCount,
          currentPage: offset / limit + 1,
          products,
          productsGrossing,
          productsRecent,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      let mongoQuery = { companyId } as any;

      let limit = 5;

      let category = await Category.find({ ...mongoQuery, isActive: true })
        .select({
          name: 1,
          isActive: 1,
          productCount: 1,
        })
        .sort({ order: 1, createdAt: -1 })
        .lean();

      // mongoQuery.categoryId = { $ne: null };
      mongoQuery.categoryId = { $in: category.slice(0, limit).map(x => x._id) };

      let categoryProduct = await Product.aggregate([
        {
          $match: mongoQuery,
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "$categoryId",
            data: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 1,
            data: {
              $slice: ["$data", 0, 12],
            },
          },
        },
      ]);

      let categoryCount = await Category.countDocuments({ companyId, isActive: true });

      return res.json(
        sendSuccessResponse({
          category,
          product: categoryProduct,
          moreCategory: categoryCount > limit ? limit : 0
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getIdPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let productId = req.params.productId;
      let { companyId } = req.user as { companyId: string };

      if (!productId) {
        return res.json(sendErrorResponse("product not found", 1002));
      }
      let mongoQuery = { companyId } as any;

      if (productId) {
        mongoQuery["_id"] = productId;
      }

      let posts = (await Product.findOne(mongoQuery).populate("posts"))?.posts;

      let metrics = posts.map((it) => ({
        id: it._id,
        engagement: faker.datatype.number({ max: 300 }),
        impressions: faker.datatype.number({ max: 300 }),
        reach: faker.datatype.number({ max: 300 }),
        saved: faker.datatype.number({ max: 300 }),
        video_views: faker.datatype.number({ max: 300 }),
        comments_count: faker.datatype.number({ max: 300 }),
        like_count: faker.datatype.number({ max: 300 }),
      }));

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
      if (!posts) {
        return res
          .status(400)
          .json(sendErrorResponse("no product found", 1002));
      }
      return res.json(
        sendSuccessResponse({
          posts,
          metrics,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getId(req: Request, res: Response, next: NextFunction) {
    try {
      let productId = req.params.productId;
      let { companyId } = req.user as { companyId: string };

      if (!productId) {
        return res.json(sendErrorResponse("product not found", 1002));
      }
      let mongoQuery = { companyId } as any;

      if (productId) {
        mongoQuery["_id"] = productId;
      }

      console.log(mongoQuery);
      let product = await Product.findOne(mongoQuery)
        .populate("posts")
        .populate("categoryId", { name: 1 });

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
      if (!product) {
        return res
          .status(400)
          .json(sendErrorResponse("no product found", 1002));
      }
      return res.json(
        sendSuccessResponse({
          product,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getProductDetail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let slug = req.params.slug;
      let { companyId } = req.user as { companyId: string };

      if (!slug) {
        return res.json(sendErrorResponse("product not found", 1002));
      }
      let mongoQuery = { companyId } as any;

      if (slug) {
        mongoQuery["slug"] = slug;
      }

      let product = await Product.findOne(mongoQuery).populate("posts");

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
      if (!product) {
        return res
          .status(400)
          .json(sendErrorResponse("no product found", 1002));
      }
      return res.json(
        sendSuccessResponse({
          product,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async checkAndUpdateSlug(slug, companyId) {
    let updatedSlug = slug;

    // check if the exact slug already exists in the collection
    const slugExists = await Product.findOne({ slug: updatedSlug });

    // if the exact slug doesn't exist, find the last document in the collection with a matching slug and suffix
    if (slugExists) {
      const regex = new RegExp(`^${slug}-(\\d+)$`);
      const lastDoc = await Product.find({
        slug: regex,
        companyId: new ObjectId(companyId),
      })
        .sort({ $natural: -1 })
        .limit(1)
        .lean();

      // if a matching document was found, extract the suffix and increment it
      if (lastDoc.length > 0) {
        const matches = regex.exec(lastDoc[0].slug);
        const suffix = parseInt(matches[1], 10) + 1;
        updatedSlug = `${slug}-${suffix}`;
      } else {
        updatedSlug = `${slug}-1`;
      }
    }

    // return the updated slug
    return updatedSlug;
  }

  public static async post(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as IProducts[];
      let { companyId } = req.user as { companyId: string };

      let names = await Promise.all(
        productArr
          .map((it) => it.name)
          .filter((it) => !!it)
          .map(async (it) => {
            let slugValue = slug(it);
            slugValue = await Products.checkAndUpdateSlug(slugValue, companyId);
            return { name: it, slug: slugValue };
          })
      );

    
      // console.log(names);
      // return res.json(names);
      productArr = productArr
        ?.filter((it) => it.name)
        ?.map((it) => ({
          ...it,
          slug: names.find((nt) => nt.name === it.name)?.slug,
          companyId: new ObjectId(companyId),
        }))
        ?.filter((it) => it.slug);

      if (!productArr || !productArr.length) {
        return res.json(sendErrorResponse("product not array / empty"));
      }

      let categoryId = productArr[0]?.categoryId;

      if (categoryId) {
        let category = await Category.findOne({
          companyId,
          _id: categoryId,
        });

        if (!category) {
          return res.json(sendErrorResponse("Invalid category id"));
        }
      }

      if(productArr?.[0]?.slug){
          await Products.allForLoadingCache(companyId, productArr[0].slug);
      }

      let products = await Product.insertMany(productArr);

      updateCategoryProduct(categoryId);

      return res.json(sendSuccessResponse(products));
    } catch (error) {
      next(error);
    }
  }

  private static async allForLoadingCache(companyId: string, slug: string) {
    let companyDetails = await Company.findOne({
      companyId: new ObjectId(companyId),
    }).lean();

    const options: AxiosRequestConfig = {
      url: `https://sociallink.one/${companyDetails?.meta?.domainName}/product/${slug}`,
      method: "GET",
    };
    await axios(options);
  }

  public static async bulkUpload(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let file = req.file;
      let { companyId } = req.user as { companyId: string };
      let fileUrl = (await uploadImage(file, companyId)) as string;

      if (!fileUrl) {
        return res.json(sendErrorResponse("no file found / error in upload"));
      }
      const options: AxiosRequestConfig = {
        url: fileUrl,
        method: "GET",
        responseType: "arraybuffer",
      };
      let axiosResponse = await axios(options);
      const workbook = XLSX.read(axiosResponse.data);

      let worksheets = workbook.SheetNames.map((sheetName) => {
        return {
          sheetName,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
        };
      });

      if (
        worksheets[0].data.length === 1 &&
        Object.values(worksheets[0].data[0] as Record<string, unknown>).every(
          (x) => x === null || x === ""
        )
      ) {
        return res.json(sendSuccessResponse([]));
      }
      let errorRows = [];
      let names = [] as any;
      let finalData = worksheets[0].data
        .filter((it: any) => {
          if (!it.name) {
            errorRows.push(it);
            return false;
          }

          if (!typeCheckService.isText(it.name)) {
            if (!typeCheckService.isText(it?.name?.toString())) {
              errorRows.push(it);
              return false;
            }
          }

          return true;
        })
        .map((it: any) => {
          if (it.carouselImages instanceof String) {
            it.carouselImages = it.carouselImages
              ?.split(",")
              .filter((kt) => typeCheckService.isValidHttpUrl(kt));
          }

          if (it.thumbnail && !typeCheckService.isValidHttpUrl(it.thumbnail)) {
            it.thumbnail = null;
          }

          if (!typeCheckService.isText(it.name)) {
            it.name = it.name.toString().trim();
          }
          names.push(it.name);
          if (!typeCheckService.isText(it.sku)) {
            it.sku = it.sku.toString().trim();
          }
          if (it.status) {
            it.status = statusMap[it.status] || 1;
          }

          return it;
        });

      names = names?.filter((i, n, a) => !!i && a.indexOf(i) === n);
      names = await Promise.all(
        names.map(async (it) => {
          let slugValue = slug(it);
          slugValue = await Products.checkAndUpdateSlug(slugValue, companyId);
          return { name: it, slug: slugValue };
        })
      );

      console.log(names);
      let productArr = finalData
        .map((it) => ({
          sku: typeCheckService.isText(it["sku"]),
          name: typeCheckService.isText(it["name"]),
          price: typeCheckService.isNumber(it["price"]) || 0,
          status: it["status"] || 1,
          quantity: typeCheckService.isNumber(it["quantity"]) || 0,
          addedDate: typeCheckService.isDate(it["addedDate"])
            ? new Date(typeCheckService.isDate(it["addedDate"]) as string)
            : new Date(),
          thumbnail: it["thumbnail"],
          carouselImages: it["carouselImages"] || [],
          slug: names.find((st) => st.name === it.name)?.slug,
          // category: it["category"],
        }))
        ?.filter((it) => !!it.slug) as IProducts[];

      let productArrInsert = productArr
        ?.filter((it) => it.sku)
        ?.map((it) => ({
          updateOne: {
            filter: { sku: it.sku, companyId: new ObjectId(companyId) },
            update: {
              ...it,

              companyId: new ObjectId(companyId),
            },
            upsert: true,
          },
        }));

      if (!productArr || !productArr.length) {
        return res.json(sendErrorResponse("product not array / empty"));
      }

      await Product.bulkWrite(productArrInsert);

      return res.json(
        sendSuccessResponse({
          productsUploaded: productArr?.length,
          errorCount: errorRows?.length || 0,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async patch(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as IProducts[];
      let { companyId } = req.user as { companyId: string };

      if (productArr?.length > 1) {
        return res.json(sendErrorResponse("Only one product allowed now"));
      }
      let updateProductData = productArr[0];
      let productId = updateProductData?._id;
      let names = [] as any;
      productArr = productArr
        ?.filter((it) => it && it?.name)
        ?.map((it) => {
          if (!it.slug) names.push(it.name);

          return {
            ...it,

            companyId: new ObjectId(companyId),
          };
        });

      productArr = productArr?.map((it) => {
        if (!it.slug)
          return {
            ...it,

            slug: names.find((st) => st.name === it.name)?.slug,
          };
        else it;
      });

      if (!productArr || !productArr.length) {
        return res.json(sendErrorResponse("product not array / empty"));
      }

      let product = await Product.findById(productId);

      if (!product) {
        return res.json(sendErrorResponse("Invalid product id"));
      }

      let categoryId = updateProductData?.categoryId;

      if (categoryId) {
        let category = await Category.findOne({
          companyId,
          _id: categoryId,
        });

        if (!category) {
          return res.json(sendErrorResponse("Invalid category id"));
        }
      }

      if (
        !product.slug ||
        (updateProductData?.name?.toLowerCase()?.trim() &&
          updateProductData?.name?.toLowerCase()?.trim() !==
            product?.name?.toLowerCase()?.trim())
      ) {
        let slugValue = slug(updateProductData?.name);
        slugValue = await Products.checkAndUpdateSlug(slugValue, companyId);
        updateProductData.slug = slugValue;
      }

      updateProductData = Products.addProductVersion(updateProductData);
      productArr[0] = updateProductData;

      if(updateProductData?.slug){
        await Products.allForLoadingCache(companyId, updateProductData?.slug);
      }
      let products = await Promise.all(
        productArr.map(async (it) => {
          let _id = it?._id;

          if (!_id) return { update: false, _id };
          delete it?._id;

          let update = await Product.updateOne(
            { _id: _id },
            { ...it },
            {
              upsert: true,
            }
          );

          return { update: !!update.ok, _id: _id };
        })
      );

      if (product?.categoryId) {
        updateCategoryProduct(product?.categoryId);
      }

      updateCategoryProduct(categoryId);

      return res.json(sendSuccessResponse(products));
    } catch (error) {
      next(error);
    }
  }

  public static addProductVersion(updateProductData: IProducts) {
    updateProductData.productVersion = uuidv1();
    return updateProductData;
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as string[];
      let { companyId } = req.user as { companyId: string };

      if (!productArr || !productArr.length) {
        return res.json(sendErrorResponse("product not array / empty"));
      }

      let productId = productArr[0];

      let product = await Product.findById(productId);

      if (!product) {
        return res.json(sendErrorResponse("Invalid product id"));
      }

      let products = await Product.deleteMany({
        _id: { $in: productArr },
        companyId,
      });

      if (product?.categoryId) {
        updateCategoryProduct(product?.categoryId);
      }

      return res.json(
        sendSuccessResponse({ deletedCount: products?.deletedCount || 0 })
      );
    } catch (error) {
      next(error);
    }
  }
}

export default Products;
