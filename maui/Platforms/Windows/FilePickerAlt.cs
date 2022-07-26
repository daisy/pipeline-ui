
using WindowsFilePicker = Windows.Storage.Pickers.FileOpenPicker;
using Windows.Storage.Pickers;

namespace org.daisy.pipeline.ui.Platforms.Windows
{

    /// <summary>
    /// Alternative file picker to bypass an error in current implementation ...
    /// </summary>
    public class FilePickerAlt : IFilePicker
    {
        public async Task<FileResult?> PickAsync(PickOptions options = null)
        {
            var filePicker = new WindowsFilePicker();
            // Get the current window's HWND by passing in the Window object
            var hwnd = ((MauiWinUIWindow)App.Current.Windows[0].Handler.PlatformView).WindowHandle;

            // Associate the HWND with the file picker
            WinRT.Interop.InitializeWithWindow.Initialize(filePicker, hwnd);
            filePicker.ViewMode = PickerViewMode.List;
            filePicker.SuggestedStartLocation = PickerLocationId.DocumentsLibrary;
            // Mandatory
            filePicker.FileTypeFilter.Add("*");

            var result = await filePicker.PickSingleFileAsync();
            if (result != null)
            {
                return new FileResult(result.Path);

            }
            else return null;

        }

        public Task<IEnumerable<FileResult>> PickMultipleAsync(PickOptions options = null)
        {
            throw new NotImplementedException();
        }
    }
}
