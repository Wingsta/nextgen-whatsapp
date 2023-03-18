
import { NextFunction, Request, Response } from "express";
import {
    sendErrorResponse,
    sendSuccessResponse,
} from "../../../services/response/sendresponse";
import Category from "../../../models/category";
import { validateCategory, validateDuplicateCategory } from "./utils";
import Product from "../../../models/products";
import { replaceSpecialChars } from "../../../utils/constants";

class Categories {

    public static async getAllCategory(req: Request, res: Response, next: NextFunction) {
        try {
            let searchTerm = req.query.searchTerm as string;
            let { companyId } = req.user as { companyId: string };
            let {
                limit = 100000,
                offset = 0,
                sortBy = "createdAt",
                sortType = "asc",
            } = req.query as unknown as {
                limit: number;
                offset: number;
                sortBy: string;
                sortType: string;
            };

            if (limit) {
                limit = parseInt(limit.toString());
            }

            if (offset) {
                offset = parseInt(offset.toString());
            }
            let mongoQuery = { companyId } as any;

            if (searchTerm) {
                searchTerm = replaceSpecialChars(searchTerm);
                mongoQuery["$or"] = [
                    { name: new RegExp(searchTerm, "i") }
                ];
            }

            let category = await Category.find(mongoQuery)
                // .sort([[sortBy, sortType === "asc" ? 1 : -1]])
                .sort({
                    order: 1,
                    createdAt: -1
                })
                .select({
                    name: 1,
                    productCount: 1,
                    createdAt: 1,
                    isActive: 1
                })
                .skip(offset)
                .limit(limit)
                .lean();
            
            let count = await Category.countDocuments(mongoQuery);

            return res.json(
                sendSuccessResponse({
                    category,
                    count
                })
            );
        } catch (error) {
            next(error);
        }
    }

    public static async checkDuplicate(req: Request, res: Response, next: NextFunction) {
        try {

            const { error } = validateDuplicateCategory(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let { companyId } = req.user as { companyId: string };

            let { name, editId } = req.body as { name: string, editId: string | null };
            
            name = replaceSpecialChars(name);

            let query = {
                companyId: companyId,
                name : new RegExp(`^${name}$`, 'i')
            }

            if (editId) {
                query["_id"] = { $ne: editId }
            }

            let category = await Category.findOne(query)

            if (category) {
                return res.json(sendSuccessResponse({
                    exists: true
                }, 'Category details'));
            }

            return res.json(sendSuccessResponse({
                exists: false
            }, 'Category details'));
        } catch (error) {
            next(error);
        }
    }

    public static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {

            const { error } = validateCategory(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let { companyId } = req.user as { companyId: string };

            let { name, isActive } = req.body as { name: string, isActive: boolean };

            name = replaceSpecialChars(name);

            let category = await Category.findOne({
                companyId: companyId,
                name : new RegExp(`^${name}$`, 'i')
            })

            if (category) {
                return res.json(sendErrorResponse(`${category?.name} already exists!`, 1234));
            }

            await Category.create({
                name,
                isActive,
                companyId: companyId,
            });

            return res.json(sendSuccessResponse(null, "Category created successfully!"));
        } catch (error) {
            next(error);
        }
    }

    public static async editCategory(req: Request, res: Response, next: NextFunction) {
        try {

            let categoryId = req.params.categoryId as string;

            const { error } = validateCategory(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let { companyId } = req.user as { companyId: string };

            let { name, isActive } = req.body as { name: string, isActive: boolean };

            name = replaceSpecialChars(name);

            let category = await Category.findOne({
                companyId: companyId,
                _id: categoryId
            })

            if (!category) {
                return res.json(sendErrorResponse(`Invalid category id!`));
            }

            category = null;

            category = await Category.findOne({
                companyId: companyId,
                name : new RegExp(`^${name}$`, 'i'),
                _id: { $ne: categoryId }
            })

            if (category) {
                return res.json(sendErrorResponse(`${category?.name} already exists!`, 1234));
            }

            await Category.findByIdAndUpdate(categoryId, {
                name,
                isActive
            });

            return res.json(sendSuccessResponse(null, "Category updated successfully!"));
        } catch (error) {
            next(error);
        }
    }

    public static async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {

            let categoryId = req.params.categoryId as string;

            let { companyId } = req.user as { companyId: string };

            await Category.findOneAndDelete({
                companyId,
                _id: categoryId
            })

            await Product.updateMany({ categoryId }, {
                categoryId: null
            })

            return res.json(sendSuccessResponse(null, "Category deleted successfully!"));
        } catch (error) {
            next(error);
        }
    }

    public static async sortCategory(req: Request, res: Response, next: NextFunction) {
        try {

            let categories = req.body.category as string[];

            let { companyId } = req.user as { companyId: string };

            let i, categoryUpdate = [];
            for(i=0;i<categories.length;i++){
                categoryUpdate.push({
                    updateOne: {
                        filter: {
                            _id: categories[i]
                        },
                        update: {
                            order: i+1
                        }
                    }
                });
            }

            if (categoryUpdate.length > 0) {
                await Category.bulkWrite(categoryUpdate);
            }

            return res.json(sendSuccessResponse(null, "Category updated successfully!"));
        } catch (error) {
            next(error);
        }
    }
}

export default Categories;
