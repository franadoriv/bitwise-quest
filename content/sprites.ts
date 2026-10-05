// Pack-specific pixel sprites (planet guides and bugs), safe to bundle on the client.
// Ids are namespaced by language: "<lang>/<name>". Same legend as components/pixel/sprites.ts.
import { RUST_SPRITES } from "./rust/sprites.ts";
import { GO_SPRITES } from "./go/sprites.ts";
import { ZIG_SPRITES } from "./zig/sprites.ts";
import { HASKELL_SPRITES } from "./haskell/sprites.ts";
import { TYPESCRIPT_SPRITES } from "./typescript/sprites.ts";
import { REACT_SPRITES } from "./react/sprites.ts";

export const PACK_SPRITES: Record<string, string[]> = {
  ...RUST_SPRITES,
  ...GO_SPRITES,
  ...ZIG_SPRITES,
  ...HASKELL_SPRITES,
  ...TYPESCRIPT_SPRITES,
  ...REACT_SPRITES,
};
