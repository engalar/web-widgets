import { defineConfig } from "vite";
import vitePluginMendix from "@engalar/vite-plugin-mendix";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vitePluginMendix({
            widgetName: pkg.widgetName,
            widgetPackage: pkg.packagePath,
            testProject: pkg.config.projectPath
        })
    ]
});
