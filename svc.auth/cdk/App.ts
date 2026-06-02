import { buildService } from "@dannywrayuk/service-platform/buildService";
import { config } from "../config.ts";
import * as handlers from "../handlers.ts";

buildService({ config, handlers, });
