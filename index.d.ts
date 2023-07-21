declare module "types/filo";

type MergeTypes<T extends unknown[], M extends object> =
    T extends [a: infer A, ...rest: infer R] ?
        ((
            A extends (arg?: any) => infer K ? K & M : (
                A extends object ? A & M : M
                )
        ) & MergeTypes<R, (
            A extends (this: M, arg?: any) => infer K ? K & M : (
                A extends object ? A & M : M
                )
            )>) : {};

// type MergeTypes<T extends unknown[]> =
//     T extends [a: Layer<infer A>, ...rest: infer R] ? (A & MergeTypes<R>) : {};

// type Layer<Ks> = Ks

type DefinedLayer<Ks extends object> = {
    [key in keyof Ks]: Ks[key] extends (arg?: any) => infer L ? (arg: any) => L : Ks[key] // todo. make specific
}
type Layer<Ks extends (object | FiloConstructor<any>)> = Ks extends object ? DefinedLayer<Ks> : (
    Ks extends (arg?: any) => infer C ? C : {}
)
// type MergeLayers<LS extends Layer<any>[], THIS extends object> = LS extends [a: infer A, ...rest: infer R] ? (
//     MergeLayers<R, THIS & (A extends (arg?: any) => infer K ? K : (
//         A extends object ? A : {}
//         ))>
// ) : []

type FiloClass<LS extends Layer<any>[]> = MergeTypes<LS, {}>
type FiloConstructor<C extends FiloClass<any>> = (arg?: any) => C

// export function filo<L2>(layer1, layer2: L2 extends {} ? {[k in keyof L2]: L2[k] extends (this: typeof layer1 extends (a?: any) => infer T ? T : typeof layer1, arg?: any) => infer L ? (arg: any) => L : L2[k]} : L2): FiloConstructor<FiloClass<[typeof layer1, typeof layer2]>>
export function filo<LS extends Layer<any>[]>(...layers: LS): FiloConstructor<FiloClass<LS>>
export function inject<T extends FiloClass<any>>(startAt: any, type: FiloConstructor<T>): T;
export function cast<T extends FiloClass<any>>(what: any, type: FiloConstructor<T>): T;
export function parent(of: any);
export function constructor(of: any);