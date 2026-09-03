import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Protege as rotas de escrita/destrutivas contra chamada sem credencial —
 * mesmo padrão do ERP_DISPONIBILIDADE_SECRET em prjdev-competitividade-api
 * (segredo compartilhado no header, sem JWT, pra chamada serviço-a-serviço).
 */
@Injectable()
export class SecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.PROJECT_SEARCH_SECRET;
    // Sem segredo configurado: não bloqueia (ambiente local/dev).
    if (!expected) return true;

    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-project-search-secret'];
    if (provided !== expected) {
      throw new UnauthorizedException('Segredo inválido.');
    }
    return true;
  }
}
