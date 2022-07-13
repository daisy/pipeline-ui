namespace org.daisy.pipeline.ui.Controls
{
    public class ParameterEventArgs : EventArgs
    {
        public object Value { get; set; } = null;

        public Type valueType { get; set; }
    }

}
