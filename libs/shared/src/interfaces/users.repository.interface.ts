import { BaseInterfaceRepository } from '@app/shared';

import { UserEntity } from '@app/shared';

export interface UserRepositoryInterface
  extends BaseInterfaceRepository<UserEntity> {}