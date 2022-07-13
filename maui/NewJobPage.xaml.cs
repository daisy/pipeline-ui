
using org.daisy.jnet;
using org.daisy.pipeline.job;
using org.daisy.pipeline.ui.Controls;
using System.Linq;
using System.Reflection;

namespace org.daisy.pipeline.ui;

public partial class NewJobPage : ContentPage
{


    
    public string SelectedScriptId = "";

    public List<string> ScriptsList {
        get {
            return PipelineWorker.Scripts.Keys.ToList();
        }
    }

    protected override void OnNavigatedTo(NavigatedToEventArgs args)
    {
        base.OnNavigatedTo(args);
        if (this.IsLoaded)
        {
            ScriptPicker.Focus();
            SemanticScreenReader.Announce(ScriptPicker.Title);
        }
    }

    public NewJobPage()
	{
		InitializeComponent();

        //ScriptPicker.SetSemanticFocus();

        if (PipelineWorker.State < PipelineWorker.StateValue.Ready)
        {
            PipelineWorker.Start();
            ScriptPicker.ItemsSource = new List<string>()
            {
                "Pipeline is loading, please wait ..."
            };
            
            Task.Run(() =>
            {
                while (PipelineWorker.State < PipelineWorker.StateValue.Ready)
                {
                    Task.Delay(100).Wait();
                    if(PipelineWorker.State == PipelineWorker.StateValue.Stopped)
                    {
                        Application.Current.Dispatcher.Dispatch(
                            () =>
                            {
                                ScriptPicker.ItemsSource = new List<string>()
                                {
                                    "Pipeline is currently stopped, please check the pipeline status under the pipeline tab"
                                };
                            }
                        );
                        // Abort the task
                        return;
                    }
                }
                Application.Current.Dispatcher.Dispatch(
                    () =>
                    {
                        ScriptPicker.ItemsSource = ScriptsList;
                    }    
                );
                
            });
            
        } else
        {

            ScriptPicker.ItemsSource = ScriptsList;
        }

    }

    public bool onInputFileSelected(string path)
    {
        return File.Exists(path);
    }

    /// <summary>
    /// For the proposition of retrieving scripts that are compatible with the intput file
    /// - For XML file, that means checking for the doctype or root namespace
    /// - For zip file, that means checking for specific file that match specification
    /// like ncc.html for daisy2, or OPF file
    /// </summary>
    /// <param name="sender"></param>
    /// <param name="e"></param>
    private void OnInputFileChanged(object sender, EventArgs e)
    {
        
        // TODO check for file type and filter scripts lists based on input file
        // Based on what i saw in different script
        // I need to do
        // - check for any input or option that match the input file mimetype
        // - filter the script

        //ScriptPicker.ItemsSource = ScriptsList.FindAll(
        //    (script) => { 
        //        if (script != null) return true;
        //        return false;
        //    }
        //);
    }



    void OnScriptPickerSelectedIndexChanged(object sender, EventArgs e)
    {
        var picker = (Picker)sender;
        int selectedIndex = picker.SelectedIndex;

        StartAJobButton.IsEnabled = false;

        JobParameters.Clear();

        if (selectedIndex != -1)
        {

            SelectedScriptId = (string)picker.ItemsSource[selectedIndex];
            if (PipelineWorker.Scripts.ContainsKey(SelectedScriptId))
            {
                foreach (var item in PipelineWorker.Scripts["dtbook-to-daisy3"].Parameters)
                {
                    if(item.Type != script.Parameter.TypeCategory.Output)
                    {
                        JobParameters.Add(new ParameterView(item)
                        {
                            OnValueChanged = (sender, eventArgs) =>
                            {
                                ParameterView realSender = (ParameterView)sender;
                                
                                // Validate the parameter
                                if (realSender.BoundParameter != null
                                                && realSender.BoundParameter.Required
                                                && string.IsNullOrEmpty((string)eventArgs.Value))
                                {
                                    realSender.changeValidationStatus(
                                        ParameterView.ValidationStatus.Invalid,
                                        $"A value is required for {realSender.Label} field");

                                } else
                                {
                                    bool isValid = true;
                                    switch (item.DataTypeValue)
                                    {
                                        case script.Parameter.DataType.Value.Directory:
                                            if (realSender.BoundParameter != null
                                                    && realSender.BoundParameter.Required)
                                            {
                                                if (string.IsNullOrEmpty((string)eventArgs.Value))
                                                {
                                                    realSender.changeValidationStatus(
                                                    ParameterView.ValidationStatus.Invalid,
                                                    $"A value is required for {realSender.Label} field");

                                                    break;
                                                } 
                                                else if(!Directory.Exists((string)eventArgs.Value))
                                                {
                                                    realSender.changeValidationStatus(
                                                        ParameterView.ValidationStatus.Invalid,
                                                        "This folder was not found on your system"
                                                    );
                                                    break;
                                                } else goto default;
                                            } else goto default;
                                        case script.Parameter.DataType.Value.File:
                                            if (realSender.BoundParameter != null
                                                    && realSender.BoundParameter.Required )
                                            {
                                                if (string.IsNullOrEmpty((string)eventArgs.Value))
                                                {
                                                    realSender.changeValidationStatus(
                                                        ParameterView.ValidationStatus.Invalid,
                                                        $"A value is required for {realSender.Label} field");
                                                    break;
                                                } else if (!File.Exists(eventArgs.Value.ToString()))
                                                {
                                                    realSender.changeValidationStatus(
                                                        ParameterView.ValidationStatus.Invalid,
                                                        "This file was not found on your system"
                                                    );
                                                    break;
                                                }
                                                else goto default;
                                            } else goto default;
                                        default:
                                            realSender.changeValidationStatus(
                                                ParameterView.ValidationStatus.Valid
                                            );
                                            break;
                                    }
                                }
                                
                                // change status based on validation
                                // Check if any JobParameters item is invalid to allow the start button to be clicked
                                
                                StartAJobButton.IsEnabled = true;
                                foreach (ParameterView parameterView in JobParameters)
                                {
                                    if (parameterView.DataValidationStatus == ParameterView.ValidationStatus.Invalid)
                                    {
                                        StartAJobButton.IsEnabled = false;
                                    }
                                }
                            }
                        });
                    }
                    
                }
                // Check if the default settings are all valid
                StartAJobButton.IsEnabled = true;
                foreach (ParameterView parameterView in JobParameters)
                {
                    if(parameterView.DataValidationStatus == ParameterView.ValidationStatus.Invalid)
                    {
                        StartAJobButton.IsEnabled = false;
                    }
                }
            } else
            {
                // throw new Exception($"Unknown script {SelectedScript} selected");
            }
        }
    }

    public void OnStartAJobButtonClicked(object sender, EventArgs e)
    {
        Dictionary<string, object> parametersValue = new Dictionary<string, object>();
        // Start a job and create a new job page for it
        foreach (ParameterView parameterView in JobParameters)
        {
            if (parameterView.BoundParameter != null)
            {
                parametersValue.Add(parameterView.BoundParameter.NameOrPort, parameterView.Value);
            }
            
        }
        //PipelineWorker.launch(PipelineWorker.Scripts[SelectedScriptId], parametersValue, null); 

        // Message the main app to create a job page and add it to the flyout/tabs list of pages
        MessagingCenter.Send(this, "New job", PipelineWorker.launch(PipelineWorker.Scripts[SelectedScriptId], parametersValue, null));
    }
    public void OnResetJobButtonClicked(object sender, EventArgs e)
    {
        // reset all parameters to default or empty value
    }

}