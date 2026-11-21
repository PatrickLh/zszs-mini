export const rounds = [
 [1,3,6,9,12,15],[17,20,23,27,31,35],[40,45,50,55,60,65],[72,79,87,96,105,115],[125,135,150,165,180,200],[220,240,260,280,300,320],[350,380,410,440,470,500]
];
const pills=[1,1,2,3,5,5,5], completion=[0,5,10,0,0,0,0];
export const milestones=rounds.flatMap((row,r)=>row.map((kills,i)=>({round:r+1,kills,pills:pills[r]+(i===5?completion[r]:0),pages:40+10*r+(i===5?80+20*r:0),end:i===5})));
const definitions=[
 [['法象真言',2,50,3],['领悟点',1000,50,8],['强化粉尘·蓝',1000,50,8]],
 [['灵韵仙蛋',5,75,8],['飞剑残魄',200,100,6],['仙界心法碎片自选',40,100,6]],
 [['神兵陨铁',2,150,6],['仙君悟法被动心法碎片',40,100,30],['神铸石',20,150,6]],
 [['仙君悟法主动心法碎片',40,100,6],['圣宝灵髓',5,200,2],['金仙红色法则碎片箱',40,200,12]],
 [['道痕结晶',1,1200,2],['圣宝灵髓',10,300,4],['金仙大道法则碎片箱',40,200,12]]
];
export const goods=definitions.flatMap((row,l)=>row.map(([name,amount,price,limit],i)=>({id:`${l}-${i}`,layer:l+1,name,amount,price,limit,refund:l+1,unlock:[0,100,300,600,1000][l]})));
export const packs=[ [6,10,10,3],[30,20,30,2],[68,40,50,2],[128,50,100,5],[198,60,120,5],[328,80,160,10],[648,100,300,12] ];
export function expectedHits(units=6){let e=[0];for(let i=1;i<=units;i++)e[i]=1+.8*e[Math.max(0,i-1)]+.2*e[Math.max(0,i-2)];return e[units]}
// Fixed selected shopping order: lowest layer first, then screen order. No automatic filler purchases.
export function simulate({stock=0,pages=0,kills=0,health=60,mode='expected',selected={},dailyFree=0,dailyPaid=0,packCounts=[]}={}){
 let extraPills=dailyFree+dailyPaid*3, extraPages=(dailyFree+dailyPaid)*2, money=0;
 packs.forEach(([price,p,q],i)=>{let n=Math.min(packs[i][3],Math.max(0,Math.trunc(packCounts[i]||0)));extraPills+=p*n;extraPages+=q*n;money+=price*n});
 let balance=stock+extraPills, currency=pages+extraPages, spent=0, cost=0,refund=0,rows=[],shopping=[];
 const left=goods.map(g=>Math.min(g.limit,Math.max(0,Math.trunc(selected[g.id]||0))));
 function shop(){let changed=true;while(changed){changed=false;goods.forEach((g,i)=>{while(left[i]>0&&spent>=g.unlock&&currency>=g.price){left[i]--;currency-=g.price;spent+=g.price;balance+=g.refund;refund+=g.refund;shopping.push({...g});changed=true}})}}
 shop();let previous=kills, missing=0;
 for(const m of milestones){if(m.kills<=kills)continue;
 const count=m.kills-previous;
 const hit=mode==='safe'?6:expectedHits();
 const firstUnits=Math.ceil(Math.min(60,Math.max(1,health))/10);
 const need=count*hit+(previous===kills?((mode==='safe'?firstUnits:expectedHits(firstUnits))-hit):0);
 cost+=need;balance-=need;missing=Math.max(missing,-balance); // Need must be available before reaching this reward.
 balance+=m.pills;refund+=m.pills;currency+=m.pages;shop();
 rows.push({...m,cost:Math.ceil(cost),refund,pages:currency,spent,required:Math.ceil(Math.max(0,stock+missing)),gap:Math.ceil(Math.max(0,missing)),remaining:Math.floor(balance),purchases:shopping.length});previous=m.kills;
 }
 return {rows,money,extraPills,extraPages,shopping,pending:goods.map((g,i)=>({...g,count:left[i]})).filter(g=>g.count)};
}
