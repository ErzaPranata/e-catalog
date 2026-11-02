import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { Public } from '../common/decorators/public.decorator';
import { CheckoutDto } from './dto';

@ApiTags('Checkout')
@Controller('orders')
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create order from checkout' })
  @ApiResponse({ status: 201, description: 'Order created with WhatsApp link' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createOrder(@Body() dto: CheckoutDto) {
    return this.checkoutService.processCheckout(dto);
  }
}