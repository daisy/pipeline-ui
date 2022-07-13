using CommunityToolkit.Maui;

namespace org.daisy.pipeline.ui;

public static class MauiProgram
{

	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>().UseMauiCommunityToolkit()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});
#if WINDOWS
		builder.Services.AddTransient<IFolderPicker, Platforms.Windows.FolderPicker>();
#elif MACCATALYST
        builder.Services.AddTransient<IFolderPicker, Platforms.MacCatalyst.FolderPicker>();
#endif

        return builder.Build();
	}
}
