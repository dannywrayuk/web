import { App } from "aws-cdk-lib";
import { AuthStack } from "./stack/AuthStack";

const app = new App();

new AuthStack(app);
