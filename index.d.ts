declare module "types/filo";

type MergeTypes<T extends Layer<unknown>[]> =
    T extends [a: Layer<infer A>, ...rest: infer R] ? A & MergeTypes<R> : {};

type Layer<Ks> = {[key in keyof Ks]: (arg: any) => (void | FiloClass<any>)}

type FiloClass<LS extends Layer<any>[]> = MergeTypes<LS>
type FiloConstructor<C extends FiloClass<any>> = (arg: any) => C

export function filo<LS extends Layer<unknown>[]>(...layers: LS): FiloConstructor<FiloClass<LS>>
export function inject<T extends FiloClass<any>>(startAt: any, type: FiloConstructor<T>): T;
export function parent(of: any);
export function constructor(of: any);