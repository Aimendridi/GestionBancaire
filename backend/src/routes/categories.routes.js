const router=require('express').Router(); const {z}=require('zod'); const pool=require('../config/db'); const {authenticate,requireRole}=require('../middleware/auth'); const validate=require('../middleware/validate'); const asyncHandler=require('../utils/asyncHandler');
router.use(authenticate,requireRole('CLIENT'));
router.get('/',validate(z.object({type:z.enum(['REVENU','DEPENSE']).optional()}),'query'),asyncHandler(async(req,res)=>{const [rows]=await pool.query(`SELECT id,nom,type FROM categories ${req.query.type?'WHERE type=?':''} ORDER BY type,nom`,req.query.type?[req.query.type]:[]);res.json(rows)}));
module.exports=router;
