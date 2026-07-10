/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  MASTER = 'MASTER',
  ADMIN_CASA = 'ADMIN_CASA',
  EDITOR = 'EDITOR',
  TESTADOR = 'TESTADOR',
  BLOQUEADO = 'BLOQUEADO'
}

export interface UserRole {
  uid: string;
  email: string;
  role: Role;
  id_casa: string;
  ambiente: 'producao' | 'teste';
}

export interface CasaAxe {
  id: string;
  nome: string;
  admin_email: string;
  created_at: any; // Can be Timestamp or ISO string
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.MASTER]: 100,
  [Role.ADMIN_CASA]: 80,
  [Role.EDITOR]: 50,
  [Role.TESTADOR]: 30,
  [Role.BLOQUEADO]: 0
};

export function rolePodeAcessar(userRole: Role, nivelMinimo: Role): boolean {
  const userNivel = ROLE_HIERARCHY[userRole] || 0;
  const minimoNivel = ROLE_HIERARCHY[nivelMinimo] || 0;
  return userNivel >= minimoNivel;
}
