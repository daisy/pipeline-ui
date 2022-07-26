namespace org.daisy.pipeline.ui;

public partial class JobsPage : ContentPage
{

    List<JobView> Jobs;

    public JobsPage()
    {
        Jobs = new List<JobView>();

        InitializeComponent();
        
        MessagingCenter.Subscribe<NewJobPage, Job>(this, "New job", async (sender, job) =>
        {

            Jobs.Add(
                new JobView(job)
            );

            // Remove the previous empty shell page after adding the first job
            if (NoJobs.IsVisible)
            {
                NoJobs.IsVisible = false;
            }
            if (!JobsList.IsVisible)
            {
                JobsList.IsVisible = true;
            }
            int index = Jobs.Count - 1;
            Button jobButton = new Button();
            jobButton.Text = "Job " + index.ToString();
            jobButton.Clicked += (sender, e) =>
            {
                JobFrame.Clear();
                JobFrame.Add(
                    Jobs[index]
                );
            };
            JobsList.Add(jobButton);

            JobFrame.Clear();
            JobFrame.Add(
                Jobs[index]
            );
            // TODO find a way to navigate to page
            this.IsEnabled = true;
        });
    }

    /// <summary>
    /// 
    /// </summary>
    public JobsPage(List<JobView> jobs = null) : this()
    {
        InitializeComponent();
        if (jobs != null)
        {
            Jobs = jobs;
            // Remove the previous empty shell page after adding the first job
            if (NoJobs.IsVisible)
            {
                NoJobs.IsVisible = false;
            }
            if (!JobsList.IsVisible)
            {
                JobsList.IsVisible = true;
            }
            foreach (JobView job in Jobs)
            {
                JobFrame.Add(job);
            }
        }
        else
        {
            Jobs = new List<JobView>();
        }

       
    }

    protected override async void OnNavigatedTo(NavigatedToEventArgs args)
    {
        base.OnNavigatedTo(args);
        while (!this.IsLoaded) await Task.Delay(25);
        //ScriptPicker.Focus();
        //SemanticScreenReader.Announce(ScriptPicker.Title);
        Application.Current.Windows[0].Title = App.MainTitle + " - " + this.Title;

    }
}