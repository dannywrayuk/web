import { buildService } from "@dannywrayuk/service-platform/buildService";
import { config } from "../config.ts";
import * as handlers from "../interface.ts";

buildService({ config, handlers });
