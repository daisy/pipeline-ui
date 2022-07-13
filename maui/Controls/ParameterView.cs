namespace org.daisy.pipeline.ui.Controls;

/// <summary>
/// Basic class to create a Parameter for the pipeline
/// (There might be a cleaner way to do this)
/// </summary>
public class ParameterView : ContentView
{
    public Label ParameterLabel = new Label() {
        HorizontalOptions = LayoutOptions.Start,
        Text = "Default text",
        VerticalOptions = LayoutOptions.Center,
    };

    public Button ParameterButton;

    private script.Parameter.DataType.Value _dataType = script.Parameter.DataType.Value.String;

    // set UI when updating DataType
    public script.Parameter.DataType.Value DataType { 
        get { return _dataType; } 
        set
        {
            _dataType = value;
            switch (_dataType)
            {
                case script.Parameter.DataType.Value.Directory:
                case script.Parameter.DataType.Value.File:
                    string typeName = DataType == script.Parameter.DataType.Value.Directory ?
                        "directory" :
                        "file";
                    ParameterButton = new Button()
                    {
                        Text = $"Select a {typeName}",
                        HorizontalOptions = LayoutOptions.Start,
                    };
                    ParameterButton.Clicked += OnInputButtonClicked;
                    ParameterEntry = new Entry() {
                        MinimumWidthRequest = 250,
                        VerticalOptions = LayoutOptions.Center
                    };
                    ParameterEntry.TextChanged += OnInputValueChange;
                    Content = new StackLayout
                    {
                        Children = {
                        new HorizontalStackLayout
                        {
                            Spacing = 10,
                            Children =
                            {   
                                ParameterLabel,
                                ParameterButton,
                                ParameterEntry
                            }
                        },
                        ValidationError

                    }
                    };
                    break;
                case script.Parameter.DataType.Value.Boolean:
                    ParameterSwitch = new Switch() { IsToggled = false };
                    ParameterSwitch.Toggled += OnInputValueChange;
                    SemanticProperties.SetDescription(ParameterSwitch, _label);
                    Content = new StackLayout
                    {
                        Children = {
                            new HorizontalStackLayout
                            {
                                Spacing = 10,
                                Children =
                                {
                                    ParameterLabel,
                                    ParameterSwitch
                                }
                            },
                            ValidationError
                        }
                    };
                    break;
                case script.Parameter.DataType.Value.String:
                default:
                    ParameterEntry = new Entry() {
                        MinimumWidthRequest = 250,
                        VerticalOptions = LayoutOptions.Center
                    };
                    ParameterEntry.TextChanged += OnInputValueChange;
                    SemanticProperties.SetDescription(ParameterEntry, _label);
                    Content = new StackLayout
                    {
                        Children = {
                            new HorizontalStackLayout
                            {
                                Spacing = 10,
                                Children =
                                {
                                    ParameterLabel,
                                    ParameterEntry
                                }
                            },
                            ValidationError
                        }
                    };
                    break;
            }
        }
    }

    private Entry ParameterEntry;
    private Switch ParameterSwitch;


    private string _label;
    public string Label { 
        get
        {
            return _label;
        }
        set {
            _label = value;
            ParameterLabel.Text = _label;// + " : ";
        }
    }

    /// <summary>
    /// External action to perform when value changes.
    /// Can/Should include data validation indicators change using
    /// changeValidationStatus( status ) to change the style of the param
    /// </summary>
    public EventHandler<ParameterEventArgs> OnValueChanged { get; set; }


    public enum ValidationStatus
    {
        Valid,
        Invalid,
        None
    }

    // Default for label and entry validation

    public ValidationStatus DataValidationStatus
    {
        get;
        set;
    } = ValidationStatus.None; // No Validation by default;

    public Label ValidationError { get; set; } = new Label()
    {
        IsVisible = false,
        Text = ""
        // TODO set invalid style
    };

    public void changeValidationStatus(ValidationStatus newStatus, string errorMessage = "")
    {
        DataValidationStatus = newStatus;
        ValidationError.Text = errorMessage;
        ValidationError.IsVisible = !string.IsNullOrEmpty(errorMessage);
    }


    private Style validStyle, invalidStyle;


    public object Value
    {
		get {
            switch (DataType)
            {
                case script.Parameter.DataType.Value.Boolean:
                    if (ParameterSwitch == null) ParameterSwitch = new Switch();
                    return ParameterSwitch.IsToggled;
                case script.Parameter.DataType.Value.Integer:
                case script.Parameter.DataType.Value.File:
                case script.Parameter.DataType.Value.Directory:
                case script.Parameter.DataType.Value.String:
                case script.Parameter.DataType.Value.Unknown:
                default:
                    if (ParameterEntry == null) ParameterEntry = new Entry();
                    return ParameterEntry.Text;
            }
			
			
		}
        set {
            Type valueType;
            switch (DataType)
            {
                case script.Parameter.DataType.Value.Boolean:
                    if (ParameterSwitch == null) ParameterSwitch = new Switch();
                    valueType = typeof(bool);
                    ParameterSwitch.IsToggled = (bool) value;
                    break;
                case script.Parameter.DataType.Value.Integer:
                case script.Parameter.DataType.Value.File:
                case script.Parameter.DataType.Value.Directory:
                case script.Parameter.DataType.Value.String:
                case script.Parameter.DataType.Value.Unknown:
                default:
                    if (ParameterEntry == null) ParameterEntry = new Entry();
                    valueType = typeof(string);
                    ParameterEntry.Text = value.ToString();
                    break;
            }
            OnValueChanged?.Invoke(this, new ParameterEventArgs() { Value = value, valueType = valueType });
        }
    }

	public ParameterView(script.Parameter.DataType.Value dataType = script.Parameter.DataType.Value.String)
	{
		DataType = dataType;
	}

    public pipeline.script.Parameter BoundParameter { get; set; } = null;
    public ParameterView(pipeline.script.Parameter fromPipelineParameter) 
        : this(fromPipelineParameter.DataTypeValue)
    {
        // Update default value if there is one provided for the parameter
        BoundParameter = fromPipelineParameter;

        Value = BoundParameter.UserValue ?? BoundParameter.DefaultValue ?? Value ?? "";
        Label = (string.IsNullOrEmpty(BoundParameter.NiceName)
                ? (string.IsNullOrEmpty(BoundParameter.NameOrPort)
                    ? "! Unnamed parameter !"
                    : BoundParameter.NameOrPort)
                : BoundParameter.NiceName
                );

        // pre-validate default value
        if ((BoundParameter.Required)  && string.IsNullOrEmpty((string)Value))
        {
            changeValidationStatus(ValidationStatus.Invalid, $"A value is required for {Label} field");
        }
    }

    public async void OnInputButtonClicked(object sender, EventArgs e)
    {
        if (this.DataType == script.Parameter.DataType.Value.Directory)
        {
            var result = await FolderPicker.Default.PickFolder();
            if (result != null)
            {
                Value = result.FullName;
                OnValueChanged?.Invoke(this, new ParameterEventArgs() { Value = Value, valueType = typeof(string)});
            }
        } else if(this.DataType == script.Parameter.DataType.Value.File){
            var result = await FilePicker.Default.PickAsync(PickOptions.Default);
            if (result != null)
            {
                Value = result.FullPath;
                OnValueChanged?.Invoke(this, new ParameterEventArgs() { Value = Value, valueType = typeof(string) });
            }
        } else
        {
            // should be accessed, might need to throw 
        }
    }


    public void OnInputValueChange(object sender, EventArgs e)
    {
        if(sender == ParameterEntry)
        {
            Value = ((Entry)sender).Text;
        } else if (sender == ParameterSwitch)
        {
            Value = ((Switch)sender).IsToggled;
        }
    }
}
