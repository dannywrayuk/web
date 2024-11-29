import { App } from "aws-cdk-lib";
import { AuthStack } from "./stack/AuthStack.ts";

const app = new App();

new AuthStack(app);
