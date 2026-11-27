// Small TTL cache with shared in-flight reads. No dependencies or persistent storage.
/**
 * @param {{ttlMs:number,maxEntries:number,now?:()=>number}} options
 */
export function createReadCache({ttlMs,maxEntries,now=Date.now}){
 /** @type {Map<string,{promise:Promise<any>,expires:number}>} */
 const values=new Map();
 function trim(){
  while(values.size>maxEntries){
   const first=values.keys().next().value;
   if(first===undefined)break;
   values.delete(first);
  }
 }
 return {
  /**
   * @template T
   * @param {string} key
   * @param {()=>Promise<T>} load
   * @returns {Promise<T>}
   */
  get(key,load){
   const hit=values.get(key);
   if(hit&&hit.expires>now()){values.delete(key);values.set(key,hit);return hit.promise;}
   if(hit)values.delete(key);
   const promise=Promise.resolve().then(load);
   const item={promise,expires:Infinity};
   values.set(key,item);trim();
   void promise.then(()=>{if(values.get(key)===item)item.expires=now()+ttlMs;},()=>{if(values.get(key)===item)values.delete(key);});
   return promise;
  },
  /** @param {string} key @param {unknown} value */
  prime(key,value){
   const hit=values.get(key);
   if(hit&&hit.expires>now())return;
   values.delete(key);values.set(key,{promise:Promise.resolve(value),expires:now()+ttlMs});trim();
  },
  clear(){values.clear();}
 };
}
