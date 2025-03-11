import { Module } from "@medusajs/framework/utils";
import TolgeeModuleService from "./service";

export type { TolgeeModuleConfig } from "./service";

declare module "@medusajs/framework/types" {
  interface ModuleImplementations {
    [TOLGEE_MODULE]: TolgeeModuleService;
  }
}

export const TOLGEE_MODULE = "tolgeeModule"

export default Module(TOLGEE_MODULE, {
  service: TolgeeModuleService,
})
