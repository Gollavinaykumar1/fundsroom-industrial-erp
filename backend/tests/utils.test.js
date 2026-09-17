import { describe,it,expect } from 'vitest';
import { quotationLine, quotationTotal } from '../src/utils.js';

describe('quotation calculations',()=>{
  it('calculates a line after discount and GST',()=>{
    expect(quotationLine(10,100,10,18)).toBe(1062);
  });
  it('calculates grand total',()=>{
    expect(quotationTotal([
      {quantity:10,unitPrice:100,discountPct:10,gstPct:18},
      {quantity:2,unitPrice:500,discountPct:0,gstPct:18}
    ])).toBe(2242);
  });
});
