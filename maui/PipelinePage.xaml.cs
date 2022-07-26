namespace org.daisy.pipeline.ui;

public partial class PipelinePage : ContentPage
{
    public Task PipelineMonitor;
    public CancellationTokenSource PipelineMonitorCanceler;


    protected override async void OnNavigatedTo(NavigatedToEventArgs args)
    {
       
        base.OnNavigatedTo(args);
        while (!this.IsLoaded) await Task.Delay(25);
        StatusLabel.Focus();
        SemanticScreenReader.Announce(StatusLabel.Text);
        Application.Current.Windows[0].Title = App.MainTitle + " - " + this.Title;
    }

    public PipelinePage()
	{
		InitializeComponent();
        PipelineMonitorCanceler = new CancellationTokenSource();
        PipelineMonitor = Task.Run(monitorPipeline, PipelineMonitorCanceler.Token);


    }

    private void monitorPipeline()
    {
        do
        {
            // Check and update the pipeline page
            Application.Current.Dispatcher.Dispatch(
                () =>
                {
                    StatusLabel.Text =  $"DAISY Pipeline 2 is {PipelineWorker.State}";
                    ErrorLog.Text = PipelineWorker.Errors;
                    OutputLog.Text = PipelineWorker.Output;
                    
                    StartStopPipelineButton.Text = PipelineWorker.State < PipelineWorker.StateValue.Starting
                    ? (PipelineWorker.State == PipelineWorker.StateValue.Stopping
                            ? "Force stop the pipeline"
                            : "Start the pipeline"
                    ) : "Stop the pipeline";
                }
            );
            Task.Delay(100).Wait();
        } while ( PipelineWorker.State != PipelineWorker.StateValue.Stopped 
            && !PipelineMonitorCanceler.Token.IsCancellationRequested
         );
    }

    public void StartStopPipelineButtonClicked(object sender, EventArgs e)
    {
        
        switch (PipelineWorker.State)
        {
            case PipelineWorker.StateValue.Stopped:
                if (PipelineMonitor.Status == TaskStatus.Running)
                {
                    PipelineMonitorCanceler.Cancel();
                    PipelineMonitor.Wait();
                }
                PipelineWorker.Start();
                PipelineMonitorCanceler = new CancellationTokenSource();
                PipelineMonitor = Task.Run(monitorPipeline, PipelineMonitorCanceler.Token);
                break;
            case PipelineWorker.StateValue.Stopping:
                PipelineWorker.Stop(true);
                break;
            default:
                PipelineWorker.Stop();
                
                break;
        }
        
    }


}