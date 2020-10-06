import * as ttfCore from "./ttf/core_pb";
import * as ttfArtifact from "./ttf/artifact_pb";
import * as Sqrl from 'squirrelly'
import * as path from "path";
import { promises as fs } from "fs";

import { ITtfInterface } from "./ttfInterface";

function resolveBehaviorRef(behaviorRef: ttfCore.BehaviorReference.AsObject, ttfConnection: ITtfInterface): Promise<ttfCore.Behavior.AsObject> {
    const existingArtifactSymbol = new ttfArtifact.ArtifactSymbol();
    existingArtifactSymbol.setId(behaviorRef.reference?.id || "");
    return new Promise((resolve, reject) =>
        ttfConnection.getBehaviorArtifact(
            existingArtifactSymbol,
            (error, response) => (error && reject(error)) || resolve(response.toObject())
        )
    );
}

function resolveBehaviorGroupRef(behaviorRef: ttfCore.BehaviorGroupReference.AsObject, ttfConnection: ITtfInterface): Promise<ttfCore.BehaviorGroup.AsObject> {
    const existingArtifactSymbol = new ttfArtifact.ArtifactSymbol();
    existingArtifactSymbol.setId(behaviorRef.reference?.id || "");
    return new Promise((resolve, reject) =>
        ttfConnection.getBehaviorGroupArtifact(
            existingArtifactSymbol,
            (error, response) => (error && reject(error)) || resolve(response.toObject())
        )
    );
}

function resolvePropertySetRef(behaviorRef: ttfCore.PropertySetReference.AsObject, ttfConnection: ITtfInterface): Promise<ttfCore.PropertySet.AsObject> {
    const existingArtifactSymbol = new ttfArtifact.ArtifactSymbol();
    existingArtifactSymbol.setId(behaviorRef.reference?.id || "");
    return new Promise((resolve, reject) =>
        ttfConnection.getPropertySetArtifact(
            existingArtifactSymbol,
            (error, response) => (error && reject(error)) || resolve(response.toObject())
        )
    );
}

export async function writeTemplateDefinition(definition: ttfCore.TemplateDefinition, ttfConnection: ITtfInterface, templateFolder: string): Promise<string> {

    const invocationTemplate = await fs.readFile(path.join(templateFolder, "invocation.cs.template"), "utf8");
    Sqrl.templates.define('invocation', Sqrl.compile(invocationTemplate, { autoTrim: false }))

    const propertyTemplate = await fs.readFile(path.join(templateFolder, "property.cs.template"), "utf8");
    Sqrl.templates.define('property', Sqrl.compile(propertyTemplate, { autoTrim: false }))

    const tokenDefTemplate = await fs.readFile(path.join(templateFolder, "tokenDef.cs.template"), "utf8")

    Sqrl.helpers.define('behaviors', async function (content) {
        const data = content.params[0] as ttfCore.TemplateDefinition.AsObject;
        var res = "";

        for (var behaviorRef of data.behaviorsList) {
            const behavior = await resolveBehaviorRef(behaviorRef, ttfConnection);
            res += await content.exec(behavior);
        }

        for (var behaviorGroupRef of data.behaviorGroupsList) {
            const group = await resolveBehaviorGroupRef(behaviorGroupRef, ttfConnection);
            for (var behaviorRef of group.behaviorsList) {
                const behavior = await resolveBehaviorRef(behaviorRef, ttfConnection);
                res += await content.exec(behavior);
            }
        }
        return res;
    });

    Sqrl.helpers.define('properties', async function (content) {
        const data = content.params[0] as ttfCore.TemplateDefinition.AsObject;
        var res = "";

        for (var propSetRef of data.propertySetsList)
        {
            var propSet = await resolvePropertySetRef(propSetRef, ttfConnection);
            for (var prop of propSet.propertiesList) {
                res += await content.exec(prop);
            }
        }
        return res;
    })

    return await new Promise((resolve, reject) => {
        Sqrl.render(tokenDefTemplate, definition.toObject(), { async: true, autoTrim: false },
            (error, response) => (error && reject(error)) || resolve(response));
    });
}