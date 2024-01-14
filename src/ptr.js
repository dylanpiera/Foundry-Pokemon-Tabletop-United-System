import { PtuHooks } from "./scripts/hooks/index.js";

// V11 - V12 compatability
if(Math.clamp === undefined) Math.clamp = Math.clamped;

PtuHooks.listen();