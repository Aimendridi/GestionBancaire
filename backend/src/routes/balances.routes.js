const router=require('express').Router();const {authenticate,requireRole}=require('../middleware/auth');const asyncHandler=require('../utils/asyncHandler');const {getBalances}=require('../services/balance.service');
router.use(authenticate,requireRole('CLIENT'));router.get('/',asyncHandler(async(req,res)=>res.json(await getBalances(req.user.id))));module.exports=router;
