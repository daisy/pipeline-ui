using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace org.daisy.pipeline.ui
{
    /// <summary>
    /// Adapted from https://github.com/jfversluis/MauiFolderPickerSample
    /// </summary>
    public interface IFolderPicker
    {
        Task<DirectoryInfo?> PickFolder();
    }

    /// <summary>
    /// Imitate the FilePicker class that use a "Default" static public field to use a default file picker 
    /// </summary>
    public class FolderPicker
    {
        static public IFolderPicker Default { get
            {
#if WINDOWS
		        return new Platforms.Windows.FolderPicker();
#elif MACCATALYST
                return new Platforms.MacCatalyst.FolderPicker();
#else
                return null;
#endif
            }
        }
    }
}
