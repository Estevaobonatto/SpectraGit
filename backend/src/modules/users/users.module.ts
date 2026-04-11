import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileService],
  exports: [UsersService, ProfileService],
})
export class UsersModule {}
