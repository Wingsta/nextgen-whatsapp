/**
 * Define all your API web-routes
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Router } from "express";
import * as expressJwt from "express-jwt";
import * as passport from "passport";
import Locals from "../providers/Locals";

import AccountUserController from "../controllers/Api/AccountUserAuth";
import InstaAuthController from "../controllers/Api/instaauth";
import CommonController from "../controllers/Api/common/index";
import ProductController from "../controllers/Api/products/index";
import AuthRefreshController from "../controllers/Api/Auth/RefreshToken";
import DomainController from "../controllers/Api/domains/index";
import ProfileController from "../controllers/Api/profile/index";
import CartController from "../controllers/Api/cart/index";
import OrderController from "../controllers/Api/orders/index";
import AdminOrderController from "../controllers/Api/admin-orders/index";
import MessageController from "../controllers/Api/message/index";
import CustomerController from "../controllers/Api/customers/index";
import CategoryController from "../controllers/Api/category/index";
import PostalCodeController from "../controllers/Api/postalCode/index";
import DeliveryController from "../controllers/Api/delivery/index";
import InventoryController from "../controllers/Api/inventory/index";
import ConfigurationController from "../controllers/Api/configuration/index";
import { getScreenShot } from "../controllers/Api/common/pupeeter";

const router = Router();

router.get(
  "/domain-path",

  DomainController.getPaths
);

router.get(
  "/slug-path",
  
  DomainController.getPathSlugs
);

router.get(
  "/screenshot",
  getScreenShot
);

router.post(
	"/upload",
	passport.authenticate("jwt", { session: false }),
	CommonController.upload
);

router.post(
  "/credits-order",
  passport.authenticate("jwt", { session: false }),
  CommonController.createOrder
);

router.get(
  "/credits-order",
  passport.authenticate("jwt", { session: false }),
  CommonController.getOrder
);

router.get(
  "/transaction-logs",
  passport.authenticate("jwt", { session: false }),
  CommonController.getTransactionLogs
);

router.get(
  "/message-logs",
  passport.authenticate("jwt", { session: false }),
  CommonController.getTransactionLogs
);

router.patch(
  "/credits/razorpay-response",
  passport.authenticate("jwt", { session: false }),

  CommonController.updateRazorpayPayment
);

router.post(
  "/credits/webhook/razorpay-response",
  CommonController.updateRazorpayPaymentWebhook
);

router.patch(
  "/credits/razorpay-cancel",
  passport.authenticate("jwt", { session: false }),

  CommonController.cancelRazorpayPayment
);


router.post(
	"/uploadForSocialLink",
	passport.authenticate("jwt", { session: false }),
	CommonController.uploadForSocialLink
);

router.post(
	"/bulkupload",
	passport.authenticate("jwt", { session: false }),
	ProductController.bulkUpload
);

router.post(
	"/signup",
	//   passport.authenticate("jwt", { session: false }),
	AccountUserController.signup
);


router.post(
	"/login",
	//   passport.authenticate("jwt", { session: false }),
	AccountUserController.login
);


router.post(
	"/change-password",
	passport.authenticate("jwt", { session: false }),
	AccountUserController.resetPassword
);

router.get(
	"/account-user",
	passport.authenticate("jwt", { session: false }),
	AccountUserController.getAccountUser
);

router.patch(
	"/account-user",
	passport.authenticate("jwt", { session: false }),
	AccountUserController.patchAccountUser
);

router.post(
	"/insta/login",
	passport.authenticate("jwt", { session: false }),
	InstaAuthController.login
);

router.get(
	"/insta/post",
	passport.authenticate("jwt", { session: false }),
	InstaAuthController.get
);

router.post(
	"/insta/carousel",
	passport.authenticate("jwt", { session: false }),
	InstaAuthController.createCarousel
);

router.get(
	"/insta/post/:postId",
	passport.authenticate("jwt", { session: false }),
	InstaAuthController.login
);

router.delete(
	"/insta/post/:postId",
	passport.authenticate("jwt", { session: false }),
	InstaAuthController.login
);

router.patch(
	"/insta/post/:postId",
	passport.authenticate("jwt", { session: false }),
	InstaAuthController.login
);

router.get(
	"/refreshToken",
	passport.authenticate("jwt", { session: false }),
	AuthRefreshController.perform
);

router.post(
	"/products",
	passport.authenticate("jwt", { session: false }),
	ProductController.post
);

router.patch(
	"/products",
	passport.authenticate("jwt", { session: false }),
	ProductController.patch
);

router.get(
	"/products",
	passport.authenticate("jwt", { session: false }),
	ProductController.get
);

router.get(
	"/product/:productId/analytics",
	passport.authenticate("jwt", { session: false }),
	ProductController.getIdPosts
);

router.get(
	"/product/:productId",
	passport.authenticate("jwt", { session: false }),
	ProductController.getId
);

router.get(
	"/product/sku/:slug",
	passport.authenticate("jwt", { session: false }),
	ProductController.getProductDetail
);

router.delete(
	"/products",
	passport.authenticate("jwt", { session: false }),
	ProductController.delete
);

router.post(
	"/domain/",
	passport.authenticate("jwt", { session: false }),
	DomainController.post
);

router.get(
	"/domain/exists",
	passport.authenticate("jwt", { session: false }),
	DomainController.get
);

router.get(
	"/domain/:domain",
	passport.authenticate("jwt", { session: false }),
	DomainController.getDomainMiddleWare,
	DomainController.getDomain
);

router.post(
	"/domain/toggle-publish/:domain",
	passport.authenticate("jwt", { session: false }),
	DomainController.togglePublish
);

router.post(
	"/domain/:domain/meta",
	passport.authenticate("jwt", { session: false }),
	DomainController.patchDomainMeta
);

router.post(
	"/domain/:domain",
	passport.authenticate("jwt", { session: false }),
	DomainController.patchDomain
);

// admin orders
router.get(
  "/order/pdf/:id",
  passport.authenticate("jwt", { session: false }),

  AdminOrderController.getPdfBlob
);

router.get(
	"/order/:id",
	passport.authenticate("jwt", { session: false }),

	AdminOrderController.getOneOrder
);

router.get(
	"/orderhistory/:id",
	passport.authenticate("jwt", { session: false }),

	AdminOrderController.getOrderHistory
);



router.get(
	"/order/",
	passport.authenticate("jwt", { session: false }),

	AdminOrderController.getOrders
);



router.post(
	"/order/updateStatus/:orderId",
	passport.authenticate("jwt", { session: false }),

	AdminOrderController.statusUpdate
);

router.post(
	"/order/offline",
	passport.authenticate("jwt", { session: false }),

	AdminOrderController.createOfflineOrder
);

/// profile 


router.get(
	"/public/profile",
	passport.authenticate("profile", { session: false }),

	ProfileController.getProfile
);

router.post(
	"/public/domain/:domain/verifyProfile/:mobile",
	DomainController.getPublicDomainMiddleWare,
	ProfileController.verifyProfile
);

router.post(
	"/public/domain/:domain/profile",
	DomainController.getPublicDomainMiddleWare,
	ProfileController.postProfile
);

router.patch(
	"/public/profile",
	passport.authenticate("profile", { session: false }),

	ProfileController.patchProfile
);

router.post(
	"/public/profile/address",
	passport.authenticate("profile", { session: false }),

	ProfileController.postAddress
);

router.patch(
	"/public/profile/address/:addressId",
	passport.authenticate("profile", { session: false }),

	ProfileController.patchAddress
);

router.get(
	"/profile/check-mobile/:mobile",
	passport.authenticate("jwt", { session: false }),

	ProfileController.checkMobile
);

//// cart 

router.get(
	"/public/cart/",
	passport.authenticate("profile", { session: false }),

	CartController.getCart
);

router.get(
	"/public/cart/count",
	passport.authenticate("profile", { session: false }),

	CartController.getCartCount
);

router.post(
	"/public/cart/add",
	passport.authenticate("profile", { session: false }),

	CartController.postCart
);

router.post(
	"/public/cart/alter",
	passport.authenticate("profile", { session: false }),

	CartController.alterCart
);

router.delete(
	"/public/cart/deleteAll",
	passport.authenticate("profile", { session: false }),

	CartController.deleteCartAll
);

router.delete(
	"/public/cart/delete",
	passport.authenticate("profile", { session: false }),

	CartController.deleteCart
);


//// order

router.get(
	"/public/order/count",
	passport.authenticate("profile", { session: false }),

	OrderController.getOrdersCount
);

router.get(
	"/public/order/pdf/:id",
	passport.authenticate("profile", { session: false }),

	OrderController.getPdfBlob
);

router.get(
	"/public/order/:id",
	passport.authenticate("profile", { session: false }),

	AdminOrderController.getOneOrder
);

router.get(
	"/public/orderhisotry/:id",
	passport.authenticate("profile", { session: false }),

	AdminOrderController.getOrderHistory
);

router.get(
	"/public/order/",
	passport.authenticate("profile", { session: false }),

	OrderController.getOrders
);



router.post(
	"/public/order/placeOrder",
	passport.authenticate("profile", { session: false }),

	OrderController.postOrder
);

router.patch(
	"/public/order/razorpay-response",
	passport.authenticate("profile", { session: false }),

	OrderController.updateRazorpayPayment
);

router.post(
	"/public/order/webhook/razorpay-response",
	OrderController.updateRazorpayPaymentWebhook
);

router.patch(
	"/public/order/razorpay-cancel",
	passport.authenticate("profile", { session: false }),

	OrderController.cancelRazorpayPayment
);

// router.patch(
//   "/public/domain/:domain/deleteCartAll",
//   passport.authenticate("profile", { session: false }),
//   DomainController.getPublicDomainMiddleWare,
//   CartController.deleteCartAll
// );

// router.delete(
//   "/public/domain/:domain/deleteCart",
//   passport.authenticate("profile", { session: false }),
//   DomainController.getPublicDomainMiddleWare,
//   CartController.deleteCart
// );


// router.delete(
//   "/public/domain/:domain/profile/:profile",
//   DomainController.getPublicDomainMiddleWare
// );
router.get(
	"/public/domain/:domain/products/:slug",

	DomainController.getPublicDomainProducts,
	ProductController.getProductDetail
);

router.get(
	"/public/domain/:domain/all-products",

	DomainController.getPublicDomainProducts,
	ProductController.getAllProducts
);

router.get(
	"/public/domain/:domain/category-products",

	DomainController.getPublicDomainProducts,
	ProductController.getCategory
);

router.post(
	"/public/domain/:domain/products",

	DomainController.getPublicDomainProducts,
	ProductController.get
);

router.get(
	"/public/domain/:domain",

	DomainController.getPublicDomain
);

router.get(
	"/domain/check/:domain",
	DomainController.checkSubdomain
);

router.post(
	"/public/domain/:domain/message",

	DomainController.getPublicDomainProducts,
	MessageController.postMessage
);

router.get(
	"/message",
	passport.authenticate("jwt", { session: false }),
	MessageController.getAllMessages
);

router.get(
	"/customers",
	passport.authenticate("jwt", { session: false }),
	CustomerController.getCustomers
);

router.get(
	"/customers/:customerId",
	passport.authenticate("jwt", { session: false }),
	CustomerController.getCustomerDetail
);

router.get(
	"/category",
	passport.authenticate("jwt", { session: false }),
	CategoryController.getAllCategory
);

router.post(
	"/category/check-duplicate",
	passport.authenticate("jwt", { session: false }),
	CategoryController.checkDuplicate
);

router.post(
	"/category",
	passport.authenticate("jwt", { session: false }),
	CategoryController.createCategory
);

router.patch(
	"/category/sort",
	passport.authenticate("jwt", { session: false }),
	CategoryController.sortCategory
);

router.patch(
	"/category/:categoryId",
	passport.authenticate("jwt", { session: false }),
	CategoryController.editCategory
);

router.delete(
	"/category/:categoryId",
	passport.authenticate("jwt", { session: false }),
	CategoryController.deleteCategory
);

router.post(
	"/postal-code",
	PostalCodeController.getPostalCode
);

router.get(
	"/delivery",
	passport.authenticate("jwt", { session: false }),
	DeliveryController.getDeliverySettings
);

router.post(
	"/delivery",
	passport.authenticate("jwt", { session: false }),
	DeliveryController.saveDeliverySettings
);


router.get(
	"/inventory",
	passport.authenticate("jwt", { session: false }),
	InventoryController.getInventory
);

router.get(
	"/inventory/:inventoryId",
	passport.authenticate("jwt", { session: false }),
	InventoryController.getInventoryDetail
);

router.post(
	"/inventory",
	passport.authenticate("jwt", { session: false }),
	InventoryController.postInventory
);

router.get(
	"/configuration/terms-and-conditions",
	passport.authenticate("jwt", { session: false }),
	ConfigurationController.getTermsAndConditions
);

router.post(
	"/configuration/terms-and-conditions",
	passport.authenticate("jwt", { session: false }),
	ConfigurationController.postTermsAndConditions
);

router.get(
	"/configuration/privacy-policy",
	passport.authenticate("jwt", { session: false }),
	ConfigurationController.getPrivacyPolicy
);

router.post(
	"/configuration/privacy-policy",
	passport.authenticate("jwt", { session: false }),
	ConfigurationController.postPrivacyPolicy
);

router.get(
	"/public/configuration/:domain/:configurationType",
	DomainController.getPublicDomainMiddleWare,
	ConfigurationController.getPublicConfiguration
);

router.get(
	"/configuration/notification",
	passport.authenticate("jwt", { session: false }),
	ConfigurationController.getNotificationConfiguration
);

router.post(
	"/configuration/notification",
	passport.authenticate("jwt", { session: false }),
	ConfigurationController.postNotificationConfiguration
);

export default router;
