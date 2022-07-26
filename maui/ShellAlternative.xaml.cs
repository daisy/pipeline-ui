namespace org.daisy.pipeline.ui;

/// <summary>
/// Temporary navigation page to bypass shell bad accessibility
/// </summary>
public partial class ShellAlternative : TabbedPage
{


    public ShellAlternative()
    {
        InitializeComponent();
        MessagingCenter.Subscribe<NewJobPage, Job>(this, "New job", async (sender, job) =>
        {
            this.SelectedItem = this.Jobs;
        });


    }
}