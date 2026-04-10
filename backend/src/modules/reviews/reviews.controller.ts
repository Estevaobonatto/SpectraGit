import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, CreateInlineCommentDto } from './dto/create-review.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Reviews')
@Controller('repos/:owner/:repo/pulls/:number/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review' })
  async createReview(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(owner, repo, prNumber, user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List reviews for a pull request' })
  async getReviews(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.reviewsService.getReviews(owner, repo, prNumber, user?.sub);
  }

  @Post(':reviewId/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add inline comment to a review' })
  async addInlineComment(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInlineCommentDto,
  ) {
    return this.reviewsService.addInlineComment(owner, repo, prNumber, reviewId, user.sub, dto);
  }
}
