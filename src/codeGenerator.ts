import * as ttfCore from "./ttf/core_pb";
import * as handlebars from "handlebars";
import * as path from "path";
import { promises as fs } from "fs";

import { ITtfInterface } from "./ttfInterface";


export async function writeTemplateDefinition(definition: ttfCore.TemplateDefinition, ttfConnection: ITtfInterface, templateFolder: string) : Promise<string> {

    const templatePath = path.join(templateFolder, "tokenDef.cs");
    const templateText = await fs.readFile(templatePath, "utf8")
    const template = handlebars.compile(templateText);
    
    const definitionObj = definition.toObject();
    return template(definitionObj);
}