import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de visibilidad para recursos con campo `published`.
 *
 * Los hooks pre-find de los modelos ocultan drafts cuando la query no filtra
 * por `published` explícitamente. Estos middlewares controlan quién puede
 * definir ese filtro:
 */

/**
 * Rutas públicas: ignora cualquier `?published=` enviado por el cliente.
 * Sin esto, `GET /articles?published=false` expondría los borradores.
 */
exports.stripPublishedFilter = (req: Request, _res: Response, next: NextFunction) => {
    delete req.query.published;
    next();
};

/**
 * Rutas de admin: incluye publicados y borradores en el listado.
 * Se inyecta después de sanitizar (route-level), por lo que el operador es seguro.
 */
exports.includeDrafts = (req: Request, _res: Response, next: NextFunction) => {
    // null en el $in: en MongoDB matchea tambien los docs legacy sin el campo
    (req.query as Record<string, unknown>).published = { $in: [true, false, null] };
    next();
};
