namespace org.daisy.pipeline.ui;

public partial class App : Application
{

    //public static Window MainWindow;

    public static string MainTitle = "Daisy Pipeline 2";

    public App()
	{
		InitializeComponent();

		//MainPage = new AppShell();
        MainPage = new ShellAlternative();

        //Application.Current.Windows[0].Title = MainTitle;
    }


    protected override Window CreateWindow(IActivationState activationState)
    {
        var window = base.CreateWindow(activationState);
        if (window != null)
        {
            window.Title = MainTitle;
        }

        return window;
    }
}
