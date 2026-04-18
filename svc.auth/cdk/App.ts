import { buildService } from "@dannywrayuk/service-platform/buildService";
import { config } from "../config.ts";
import * as handlers from "../interface.ts";
import * as tables from "../tables.ts";

buildService({ config, handlers, tables });
