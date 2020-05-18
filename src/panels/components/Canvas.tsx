import React, { useState } from "react";

import { Artifact } from "../../ttf/artifact_pb";

import ArtifactIcon from "./ArtifactIcon";

type Props = {
  tokenBase?: Artifact.AsObject;
  propertySets?: Artifact.AsObject[];
  behaviorGroups?: Artifact.AsObject[];
  behaviors?: Artifact.AsObject[];
  incompatabilities: any;
  artifactBeingDraggedOn?: Artifact.AsObject;
  artifactOnDragStart?: (artifact: Artifact.AsObject) => void;
  addArtifact: (id: string) => void;
};

export default function Canvas({
  tokenBase,
  propertySets,
  behaviorGroups,
  behaviors,
  incompatabilities,
  artifactBeingDraggedOn,
  artifactOnDragStart,
  addArtifact,
}: Props) {
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const style: React.CSSProperties = {
    border: "var(--borderWidth) solid var(--vscode-panel-border)",
    color: "var(--vscode-editor-foreground)",
    backgroundColor: dropTargetActive
      ? "var(--vscode-panel-dropBackground)"
      : "var(--vscode-editor-background)",
    position: "absolute",
    top: "var(--padding)",
    bottom: "var(--padding)",
    left: "var(--padding)",
    right: "var(--padding)",
    overflow: "auto",
    textAlign: "center",
  };
  const utlizedAreaStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
    padding: "calc(5 * var(--padding))",
  };
  const onDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setDropTargetActive(!!artifactBeingDraggedOn);
  };
  const onDragLeave = (ev: React.DragEvent<HTMLDivElement>) => {
    setDropTargetActive(false);
  };
  const onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    setDropTargetActive(false);
    if (artifactBeingDraggedOn?.artifactSymbol?.id) {
      addArtifact(artifactBeingDraggedOn.artifactSymbol?.id);
    }
  };
  const errorText = (id?: string) => {
    if (id && incompatabilities[id]?.length) {
      return "Incompatible with " + incompatabilities[id].join(", ");
    }
  };
  return (
    <div
      style={style}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span style={utlizedAreaStyle}>
        <span style={{ display: "inline-block" }}>
          <div style={{ whiteSpace: "nowrap" }}>
            <ArtifactIcon
              artifact={tokenBase}
              type={tokenBase ? "token-base" : "unknown"}
              onDragStart={artifactOnDragStart}
              error={errorText(tokenBase?.artifactSymbol?.id)}
            />
            {(propertySets || []).map((_) => (
              <ArtifactIcon
                key={_.artifactSymbol?.id}
                artifact={_}
                type="property-set"
                onDragStart={artifactOnDragStart}
                error={errorText(_.artifactSymbol?.id)}
              />
            ))}
          </div>
          <div style={{ width: "var(--iconWidth)" }}>
            {(behaviorGroups || []).map((_) => (
              <ArtifactIcon
                key={_.artifactSymbol?.id}
                artifact={_}
                type="behavior-group"
                onDragStart={artifactOnDragStart}
                error={errorText(_.artifactSymbol?.id)}
              />
            ))}
            {(behaviors || []).map((_) => (
              <ArtifactIcon
                key={_.artifactSymbol?.id}
                artifact={_}
                type="behavior"
                onDragStart={artifactOnDragStart}
                error={errorText(_.artifactSymbol?.id)}
              />
            ))}
          </div>
        </span>
      </span>
    </div>
  );
}
