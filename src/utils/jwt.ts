import jwt from "jsonwebtoken";
import env from "../config/env";

export interface JwtPayload {
  id: number;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  //@ts-ignore
  return jwt.sign(payload, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET as string) as JwtPayload;
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
};
