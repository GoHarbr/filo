declare module "types/filo";

type MergeTypes<T extends unknown[]> =
    T extends [a: infer A, ...rest: infer R] ?
        ((
            A extends (arg?: any) => infer K ? K : (
                A extends object ? A : {}
                )
        ) & MergeTypes<R>) : {};

// type MergeTypes<T extends unknown[]> =
//     T extends [a: Layer<infer A>, ...rest: infer R] ? (A & MergeTypes<R>) : {};

// type Layer<Ks> = Ks

type DefinedLayer<Ks extends object> = {
    [key in keyof Ks]: Ks[key] extends (arg?: any) => infer L ? (arg: any) => L : Ks[key] // todo. make specific
}
type Layer<Ks extends (object | FiloConstructor<any>)> = Ks extends object ? DefinedLayer<Ks> : (
    Ks extends (arg?: any) => infer C ? C : {}
)

type FiloClass<LS extends Layer<any>[]> = MergeTypes<LS>
type FiloConstructor<C extends FiloClass<any>> = (arg?: any) => C

export function filo<LS extends Layer<any>[]>(...layers: LS): FiloConstructor<FiloClass<LS>>
export function inject<T extends FiloClass<any>>(startAt: any, type: FiloConstructor<T>): T;
export function cast<T extends FiloClass<any>>(what: any, type: FiloConstructor<T>): T;
export function parent(of: any);
export function constructor(of: any);