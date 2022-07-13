namespace org.daisy.pipeline.ui.Services;

public interface ITrayService
{
    void Initialize();

    Action ClickHandler { get; set; }
}
