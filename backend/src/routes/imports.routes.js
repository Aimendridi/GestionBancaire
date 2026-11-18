const router=require('express').Router();const multer=require('multer');const {z}=require('zod');const pool=require('../config/db');const HttpError=require('../utils/httpError');const asyncHandler=require('../utils/asyncHandler');const {authenticate,requireRole}=require('../middleware/auth');const {parseReleve}=require('../utils/releveParser');
router.use(authenticate,requireRole('CLIENT'));const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
router.post('/preview',upload.single('file'),asyncHandler(async(req,res)=>{if(!req.file)throw new HttpError(400,'Fichier PDF obligatoire');if(req.file.buffer.subarray(0,5).toString()!=='%PDF-')throw new HttpError(415,'Le fichier fourni n’est pas un PDF valide');const compteId=Number(req.body.compteId);if(!Number.isInteger(compteId)||compteId<1)throw new HttpError(400,'Compte invalide');const [a]=await pool.query('SELECT id FROM comptes_financiers WHERE id=? AND utilisateur_id=?',[compteId,req.user.id]);if(!a.length)throw new HttpError(404,'Compte introuvable');let rows=[];try{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const doc=await pdfjs.getDocument({data:new Uint8Array(req.file.buffer),useSystemFonts:true}).promise;for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p),content=await page.getTextContent(),groups=new Map();for(const item of content.items){const y=Math.round(item.transform[5]),group=groups.get(y)||[];group.push({str:item.str,x:item.transform[4],y});groups.set(y,group);}for(const group of groups.values())rows.push(group.sort((a,b)=>a.x-b.x));}}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Impossible de lire le fichier PDF');}if(!rows.length)throw new HttpError(422,'Aucun texte extractible (PDF scanné ?). Saisissez les transactions manuellement.');const lignes=parseReleve(rows);if(!lignes.length)throw new HttpError(422,'Aucun texte extractible (PDF scanné ?). Saisissez les transactions manuellement.');const nbValides=lignes.filter(l=>l.valide).length;res.json({nomFichier:req.file.originalname,compteId,lignes,nbLignes:lignes.length,nbValides,nbInvalides:lignes.length-nbValides});}));
const confirmLineSchema=z.object({
 date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Date invalide'),
 libelle:z.string().max(255).nullable().optional(),
 montant:z.coerce.number().positive('Montant invalide'),
 type:z.enum(['REVENU','DEPENSE']),
 categorieId:z.coerce.number().int().positive().nullable().optional()
});
const confirmSchema=z.object({
 compteId:z.coerce.number().int().positive(),
 nomFichier:z.string().min(1).max(255),
 lignes:z.array(z.unknown())
});
const issueMessage=(issues)=>{
 const field=issues[0]?.path?.at(-1);
 if(field==='date')return 'Date invalide';
 if(field==='montant')return 'Montant invalide';
 if(field==='type')return 'Type invalide';
 if(field==='categorieId')return 'Cat?gorie invalide';
 if(field==='libelle')return 'Libell? invalide';
 return 'Ligne invalide';
};
router.post('/confirm',asyncHandler(async(req,res)=>{
 const parsed=confirmSchema.safeParse(req.body);
 if(!parsed.success)throw new HttpError(400,'Donn?es invalides',parsed.error.issues.map(i=>({champ:i.path.join('.'),message:i.message})));
 const b=parsed.data;
 const [accounts]=await pool.query('SELECT id FROM comptes_financiers WHERE id=? AND utilisateur_id=?',[b.compteId,req.user.id]);
 if(!accounts.length)throw new HttpError(404,'Compte introuvable');
 const valid=[],invalid=[];
 for(let i=0;i<b.lignes.length;i++){
  const line=confirmLineSchema.safeParse(b.lignes[i]);
  if(!line.success){invalid.push({numeroLigne:i+1,messageErreur:issueMessage(line.error.issues)});continue;}
  const l=line.data;
  const [year,month,day]=l.date.split('-').map(Number);
  const validDate=new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)===l.date;
  if(!validDate){invalid.push({numeroLigne:i+1,messageErreur:'Date invalide'});continue;}
  if(l.categorieId!==undefined&&l.categorieId!==null){
   const [categories]=await pool.query('SELECT id FROM categories WHERE id=? AND type=?',[l.categorieId,l.type]);
   if(!categories.length){invalid.push({numeroLigne:i+1,messageErreur:'Cat?gorie introuvable ou de type incompatible'});continue;}
  }
  valid.push(l);
 }
 const conn=await pool.getConnection();let importId;
 try{
  await conn.beginTransaction();
  const [created]=await conn.query('INSERT INTO imports_releves(compte_id,nom_fichier,nb_lignes_importees,nb_lignes_invalides) VALUES(?,?,?,?)',[b.compteId,b.nomFichier,valid.length,invalid.length]);
  importId=created.insertId;
  for(const l of valid)await conn.query('INSERT INTO transactions(compte_id,categorie_id,import_id,type,montant,date_operation,libelle) VALUES(?,?,?,?,?,?,?)',[b.compteId,l.categorieId??null,importId,l.type,l.montant,l.date,l.libelle??null]);
  await conn.commit();
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
 res.status(201).json({importId,nbImportees:valid.length,nbInvalides:invalid.length,lignesInvalides:invalid});
}));
router.get('/',asyncHandler(async(req,res)=>{const [rows]=await pool.query('SELECT i.* FROM imports_releves i JOIN comptes_financiers c ON c.id=i.compte_id WHERE c.utilisateur_id=? ORDER BY i.date_import DESC,i.id DESC',[req.user.id]);res.json(rows.map(r=>({id:r.id,compteId:r.compte_id,nomFichier:r.nom_fichier,dateImport:r.date_import,nbLignesImportees:r.nb_lignes_importees,nbLignesInvalides:r.nb_lignes_invalides})));}));
router.get('/:id(\\d+)',asyncHandler(async(req,res)=>{const [r]=await pool.query('SELECT i.* FROM imports_releves i JOIN comptes_financiers c ON c.id=i.compte_id WHERE i.id=? AND c.utilisateur_id=?',[req.params.id,req.user.id]);if(!r.length)throw new HttpError(404,'Import introuvable');const x=r[0];res.json({id:x.id,compteId:x.compte_id,nomFichier:x.nom_fichier,dateImport:x.date_import,nbLignesImportees:x.nb_lignes_importees,nbLignesInvalides:x.nb_lignes_invalides});}));module.exports=router;
