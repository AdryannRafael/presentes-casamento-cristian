declare const brandSymbol: unique symbol;

export type Brand<K extends string, T = string> = T & {
  readonly [brandSymbol]: K;
};

