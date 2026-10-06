// Pack-specific pixel sprites (planet guides and bugs), safe to bundle on the client.
// Ids are namespaced by language: "<lang>/<name>". Same legend as components/pixel/sprites.ts.
import { RUST_SPRITES } from "./rust/sprites.ts";
import { GO_SPRITES } from "./go/sprites.ts";
import { ZIG_SPRITES } from "./zig/sprites.ts";
import { HASKELL_SPRITES } from "./haskell/sprites.ts";
import { TYPESCRIPT_SPRITES } from "./typescript/sprites.ts";
import { REACT_SPRITES } from "./react/sprites.ts";
import { PYTHON_SPRITES } from "./python/sprites.ts";
import { CPP_SPRITES } from "./cpp/sprites.ts";
import { CSHARP_SPRITES } from "./csharp/sprites.ts";
import { WEBGL_SPRITES } from "./webgl/sprites.ts";
import { THREEJS_SPRITES } from "./threejs/sprites.ts";

export const PACK_SPRITES: Record<string, string[]> = {
  ...RUST_SPRITES,
  ...GO_SPRITES,
  ...ZIG_SPRITES,
  ...HASKELL_SPRITES,
  ...TYPESCRIPT_SPRITES,
  ...REACT_SPRITES,
  ...PYTHON_SPRITES,
  ...CPP_SPRITES,
  ...CSHARP_SPRITES,
  ...WEBGL_SPRITES,
  ...THREEJS_SPRITES,
};
