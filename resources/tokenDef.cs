/// {{artifact.name}}.cs

/// <summary>
/// {{artifact.artifactDefinition.businessDescription}}
/// </summary>

using Neo.SmartContract.Framework;

public class {{artifact.name}} : SmartContract
{
    // Base Token Behavior
    public static string Name() => throw new NotImplementedException();
    public static string Symbol() => throw new NotImplementedException();
    public static object TotalSupply() => throw new NotImplementedException();
    public static object GetBalance(object account) => throw new NotImplementedException();
}