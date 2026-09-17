import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export async function login(req,res){
  const {email,password} = req.body;
  const user = await prisma.user.findUnique({where:{email}});
  if(!user || !(await bcrypt.compare(password,user.password)))
    return res.status(401).json({message:'Invalid credentials'});
  const token = jwt.sign({id:user.id,role:user.role,name:user.name},process.env.JWT_SECRET,{expiresIn:'8h'});
  res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
}

export function authenticate(req,res,next){
  const header=req.headers.authorization;
  if(!header?.startsWith('Bearer ')) return res.status(401).json({message:'Authentication required'});
  try{
    req.user=jwt.verify(header.slice(7),process.env.JWT_SECRET);
    next();
  }catch{ return res.status(401).json({message:'Invalid or expired token'}); }
}

export const authorize=(...roles)=>(req,res,next)=>{
  if(!roles.includes(req.user.role)) return res.status(403).json({message:'Forbidden: insufficient role'});
  next();
};
