export const money = n => Number(Number(n).toFixed(2));
export function quotationLine(quantity,unitPrice,discountPct,gstPct){
  const base=quantity*unitPrice;
  const discounted=base-(base*discountPct/100);
  return money(discounted+(discounted*gstPct/100));
}
export function quotationTotal(items){
  return money(items.reduce((s,i)=>s+quotationLine(i.quantity,i.unitPrice,i.discountPct,i.gstPct),0));
}
export function nextNumber(prefix){
  return `${prefix}-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
}
