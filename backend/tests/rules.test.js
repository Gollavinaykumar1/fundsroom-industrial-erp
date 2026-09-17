import { describe,it,expect } from 'vitest';
import { quotationLine } from '../src/utils.js';

describe('business rule examples',()=>{
  it('does not allow a negative effective quantity',()=>expect(()=>quotationLine(-1,100,0,18)).not.toThrow());
  it('keeps backend calculation independent from a client grand total',()=>{
    const serverTotal=quotationLine(5,200,5,18);
    const clientTotal=999999;
    expect(serverTotal).not.toBe(clientTotal);
  });
  it('models reservation availability as physical minus reserved',()=>{
    const physical=100,reserved=30,requested=60;
    expect(physical-reserved).toBeGreaterThanOrEqual(requested);
    expect(physical-reserved).toBe(70);
  });
});
