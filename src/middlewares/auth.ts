import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      res.status(401).json({ error: 'Formato de token inválido' });
      return;
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      res.status(401).json({ error: 'Token mal formatado' });
      return;
    }

    try {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
      };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar autenticação' });
    return;
  }
};
