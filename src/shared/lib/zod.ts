import { z } from "zod";

// Configure before constructing any schemas: Zod's JIT availability probe uses
// Function(), which strict production CSP forbids. The interpreter validates
// the same schemas without generated code or an unsafe-eval exception.
z.config({ jitless: true });

export { z };
