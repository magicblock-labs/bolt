#addin nuget:?package=Cake.Coverlet&version=2.5.4
#tool dotnet:?package=dotnet-reportgenerator-globaltool&version=5.1.13

var testProjectsRelativePaths = new string[]
{
    "./Solana.Unity.Gum.Test/Solana.Unity.Gum.Test.csproj",
};

var target = Argument("target", "Pack");
var configuration = Argument("configuration", "Release");
var solutionFolder = "./";
var artifactsDir = MakeAbsolute(Directory("artifacts"));

var packagesDir = artifactsDir.Combine(Directory("packages"));


Task("Clean")
    .Does(() => {
        CleanDirectory(artifactsDir);
    });

Task("Restore")
    .Does(() => {
    DotNetCoreRestore(solutionFolder);
    });

Task("Build")
    .IsDependentOn("Clean")
    .IsDependentOn("Restore")
    .Does(() => {
        DotNetCoreBuild(solutionFolder, new DotNetCoreBuildSettings
        {
            NoRestore = true,
            Configuration = configuration
        });
    });


Task("Test")
    .IsDependentOn("Build")
    .Does(() => {
        var testSettings = new DotNetCoreTestSettings
        {
            NoRestore = true,
            Configuration = configuration,
            NoBuild = true,
            ArgumentCustomization = args => args.Append($"--logger trx"),
        };

        DotNetCoreTest(testProjectsRelativePaths[0], testSettings);
    });


Task("Publish")
    .IsDependentOn("Build")
    .Does(() => {
        DotNetCorePublish(solutionFolder, new DotNetCorePublishSettings
        {
            NoRestore = true,
            Configuration = configuration,
            NoBuild = true,
            OutputDirectory = artifactsDir
        });
    });

Task("Pack")
    .IsDependentOn("Publish")
    .Does(() =>
    {
        var settings = new DotNetCorePackSettings
        {
            Configuration = configuration,
            NoBuild = true,
            NoRestore = true,
            IncludeSymbols = true,
            OutputDirectory = packagesDir,
        };


        GetFiles("./src/*/*.csproj")
            .ToList()
            .ForEach(f => DotNetCorePack(f.FullPath, settings));
    });

RunTarget(target);
