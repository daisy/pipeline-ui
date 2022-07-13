using Hardcodet.Wpf.TaskbarNotification.Interop;
using Microsoft.UI.Xaml;
using org.daisy.pipeline.ui.Services;

namespace org.daisy.pipeline.ui.WinUI;

public class TrayService : ITrayService
{
    WindowsTrayIcon tray;

    public Action ClickHandler { get; set; }

    public void Initialize()
    {
        tray = new WindowsTrayIcon("Platforms/Windows/trayicon.ico");
        tray.LeftClick = () => {
            WindowExtensions.BringToFront();
            ClickHandler?.Invoke();
        };
    }
}
