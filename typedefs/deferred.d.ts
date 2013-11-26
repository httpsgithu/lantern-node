/************************************************
*                                               *
*               deferred.js API                 *
*                                               *
************************************************/

interface Promise {
  then(next: Promise): Promise;
  then(next: (...args: any[]) => Promise): Promise;
  done(success?: Function, failure?: Function): void; 
}

interface PromiseReturning {
  (...args: any[]): Promise; 
}

interface Deferred {
  promise: Promise;
  resolve(value?: any): void;
  reject(value?: any): void;
}

declare module 'deferred' {
  export function promisify(original: Function): PromiseReturning;  
}